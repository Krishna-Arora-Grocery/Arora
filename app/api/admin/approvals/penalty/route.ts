import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderSubmissionId } = body

    console.log("[SERVER] Applying manual penalty for order submission:", orderSubmissionId)

    // Get the order submission details
    const getOrderQuery = `
      query GetOrderSubmission($id: uuid!) {
        order_submissions_by_pk(id: $id) {
          id
          employee_id
          slot_id
          total_new_id_orders
          total_old_id_orders
          total_orders
          slot {
            name
            new_id_cancelled_commission
            old_id_cancelled_commission
            cancellation_submission_deadline
          }
          employee {
            name
          }
        }
      }
    `

    const orderResult = await graphqlRequest(getOrderQuery, { id: orderSubmissionId }, true)

    if (orderResult.errors || !orderResult.data.order_submissions_by_pk) {
      console.error("[SERVER] Failed to fetch order submission details")
      return NextResponse.json({ error: "Order submission not found" }, { status: 404 })
    }

    const orderData = orderResult.data.order_submissions_by_pk

    // Check if cancellation submission exists
    const checkCancellationQuery = `
      query CheckCancellationSubmission($orderSubmissionId: uuid!) {
        cancellation_submissions(where: {order_submission_id: {_eq: $orderSubmissionId}}) {
          id
        }
      }
    `

    const cancellationCheck = await graphqlRequest(checkCancellationQuery, { orderSubmissionId }, true)

    const hasCancellationSubmission = cancellationCheck.data.cancellation_submissions.length > 0

    if (hasCancellationSubmission) {
      return NextResponse.json(
        { error: "Cancellation submission already exists. Penalty cannot be applied." },
        { status: 400 },
      )
    }

    // Check if cancellation deadline has passed (IST timezone)
    const cancellationDeadline = orderData.slot.cancellation_submission_deadline
      ? new Date(orderData.slot.cancellation_submission_deadline)
      : null

    if (!cancellationDeadline) {
      return NextResponse.json({ error: "Cancellation deadline not set for this slot" }, { status: 400 })
    }

    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // 5 hours 30 minutes in milliseconds
    const now = Date.now()
    const cancellationDeadlineIST = cancellationDeadline.getTime() + IST_OFFSET_MS

    if (now <= cancellationDeadlineIST) {
      return NextResponse.json(
        {
          error: "Cancellation deadline has not passed yet. Penalty can only be applied after the deadline.",
          deadlineIST: new Date(cancellationDeadlineIST).toISOString(),
          currentTime: new Date(now).toISOString(),
        },
        { status: 400 },
      )
    }

    // Calculate penalty amounts - all orders treated as cancelled
    const newCancelledRate = orderData.slot.new_id_cancelled_commission || 7
    const oldCancelledRate = orderData.slot.old_id_cancelled_commission || 7

    const newIdCancelledAmount = orderData.total_new_id_orders * newCancelledRate
    const oldIdCancelledAmount = orderData.total_old_id_orders * oldCancelledRate
    const totalCommission = newIdCancelledAmount + oldIdCancelledAmount

    console.log("[SERVER] Penalty calculation:", {
      newIds: orderData.total_new_id_orders,
      oldIds: orderData.total_old_id_orders,
      newRate: newCancelledRate,
      oldRate: oldCancelledRate,
      newAmount: newIdCancelledAmount,
      oldAmount: oldIdCancelledAmount,
      total: totalCommission,
    })

    // Approve the order submission with penalty
    const approveOrderMutation = `
      mutation ApproveOrderSubmission($id: uuid!) {
        update_order_submissions_by_pk(
          pk_columns: { id: $id }
          _set: {
            approval_status: "approved"
            approved_at: "now()"
          }
        ) {
          id
          approval_status
          approved_at
        }
      }
    `

    const approveResult = await graphqlRequest(approveOrderMutation, { id: orderSubmissionId }, true)

    if (approveResult.errors) {
      console.error("[SERVER] GraphQL errors:", approveResult.errors)
      return NextResponse.json(
        { error: approveResult.errors[0]?.message || "Failed to approve order submission" },
        { status: 400 },
      )
    }

    // Check if commission already exists for this employee-slot combination
    const checkCommissionQuery = `
      query CheckCommission($employeeId: uuid!, $slotId: uuid!) {
        commissions(where: {employee_id: {_eq: $employeeId}, slot_id: {_eq: $slotId}}) {
          id
        }
      }
    `

    const commissionCheck = await graphqlRequest(
      checkCommissionQuery,
      { employeeId: orderData.employee_id, slotId: orderData.slot_id },
      true,
    )

    if (commissionCheck.data.commissions.length > 0) {
      // Update existing commission with penalty amounts (all orders treated as cancelled)
      const existingCommission = commissionCheck.data.commissions[0]
      const updateCommissionMutation = `
        mutation UpdateCommissionWithPenalty($id: uuid!, $newIdCancelledAmount: numeric!, $oldIdCancelledAmount: numeric!, $totalCommission: numeric!) {
          update_commissions_by_pk(
            pk_columns: { id: $id }
            _set: {
              new_id_success_amount: 0
              old_id_success_amount: 0
              new_id_cancelled_amount: $newIdCancelledAmount
              old_id_cancelled_amount: $oldIdCancelledAmount
              total_commission: $totalCommission
              status: "approved"
              calculated_at: "now()"
            }
          ) {
            id
          }
        }
      `

      await graphqlRequest(
        updateCommissionMutation,
        {
          id: existingCommission.id,
          newIdCancelledAmount,
          oldIdCancelledAmount,
          totalCommission,
        },
        true,
      )
    } else {
      // Create new commission record with penalty amounts
      const createCommissionMutation = `
        mutation CreateCommissionWithPenalty(
          $employeeId: uuid!
          $slotId: uuid!
          $orderSubmissionId: uuid!
          $newIdCancelledAmount: numeric!
          $oldIdCancelledAmount: numeric!
          $totalCommission: numeric!
        ) {
          insert_commissions_one(
            object: {
              employee_id: $employeeId
              slot_id: $slotId
              order_submission_id: $orderSubmissionId
              new_id_success_amount: 0
              old_id_success_amount: 0
              new_id_cancelled_amount: $newIdCancelledAmount
              old_id_cancelled_amount: $oldIdCancelledAmount
              total_commission: $totalCommission
              status: "approved"
              calculated_at: "now()"
            }
          ) {
            id
          }
        }
      `

      await graphqlRequest(
        createCommissionMutation,
        {
          employeeId: orderData.employee_id,
          slotId: orderData.slot_id,
          orderSubmissionId,
          newIdCancelledAmount,
          oldIdCancelledAmount,
          totalCommission,
        },
        true,
      )
    }

    console.log("[SERVER] Penalty applied successfully. All orders treated as cancelled.")

    return NextResponse.json({
      success: true,
      penaltyApplied: true,
      calculation: {
        newIds: orderData.total_new_id_orders,
        oldIds: orderData.total_old_id_orders,
        newRate: newCancelledRate,
        oldRate: oldCancelledRate,
        newAmount: newIdCancelledAmount,
        oldAmount: oldIdCancelledAmount,
        totalCommission,
      },
      employeeName: orderData.employee.name,
      slotName: orderData.slot.name,
    })
  } catch (error: any) {
    console.error("[SERVER] Error applying penalty:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
