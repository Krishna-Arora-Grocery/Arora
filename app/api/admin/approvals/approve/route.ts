import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

async function updateEmployeeStreak(employeeId: string) {
  // Get all slots ordered by date
  const slotsQuery = `
    query GetAllSlots {
      order_slots(order_by: {order_deadline: desc}) {
        id
        order_deadline
      }
    }
  `

  // Get employee's approved submissions
  const submissionsQuery = `
    query GetEmployeeSubmissions($employeeId: uuid!) {
      order_submissions(
        where: {
          employee_id: {_eq: $employeeId}
          approval_status: {_eq: "approved"}
        }
      ) {
        slot_id
        submitted_at
      }
    }
  `

  const [slotsResult, submissionsResult] = await Promise.all([
    graphqlRequest(slotsQuery, {}, true),
    graphqlRequest(submissionsQuery, { employeeId }, true),
  ])

  if (slotsResult.errors || submissionsResult.errors) {
    console.error("Failed to fetch data for streak calculation")
    return
  }

  const slots = slotsResult.data.order_slots
  const submissions = submissionsResult.data.order_submissions

  if (slots.length === 0) {
    await updateStreakInDB(employeeId, 0)
    return
  }

  // Create a map of slot dates to slot IDs for quick lookup
  const slotDateMap = new Map()
  slots.forEach((slot: any) => {
    const date = new Date(slot.order_deadline).toISOString().split("T")[0]
    slotDateMap.set(date, slot.id)
  })

  // Create a set of slot IDs that employee has submitted to
  const submittedSlotIds = new Set(submissions.map((s: any) => s.slot_id))

  // Get unique slot dates sorted descending (most recent first)
  const sortedSlotDates = Array.from(slotDateMap.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const mostRecentSlotId = slotDateMap.get(sortedSlotDates[0])

  if (!submittedSlotIds.has(mostRecentSlotId)) {
    await updateStreakInDB(employeeId, 0)
    return
  }

  let streak = 1

  for (let i = 1; i < sortedSlotDates.length; i++) {
    const currentSlotDate = sortedSlotDates[i]
    const currentSlotId = slotDateMap.get(currentSlotDate)

    if (submittedSlotIds.has(currentSlotId)) {
      streak++
    } else {
      break
    }
  }

  await updateStreakInDB(employeeId, streak)
}

async function updateStreakInDB(employeeId: string, streak: number) {
  const mutation = `
    mutation UpdateEmployeeStreak($employeeId: uuid!, $streak: Int!) {
      update_employees_by_pk(
        pk_columns: { id: $employeeId }
        _set: { streak: $streak }
      ) {
        id
        streak
      }
    }
  `

  await graphqlRequest(mutation, { employeeId, streak }, true)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissionId, submissionType } = body

    if (submissionType === "order") {
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
              new_id_success_commission
              old_id_success_commission
              new_id_cancelled_commission
              old_id_cancelled_commission
              cancellation_submission_deadline
            }
          }
        }
      `

      const orderResult = await graphqlRequest(getOrderQuery, { id: submissionId }, true)

      if (orderResult.errors || !orderResult.data.order_submissions_by_pk) {
        console.error("Failed to fetch order submission details")
        return NextResponse.json({ error: "Order submission not found" }, { status: 404 })
      }

      const orderData = orderResult.data.order_submissions_by_pk

      const checkCancellationQuery = `
        query CheckCancellationSubmission($orderSubmissionId: uuid!) {
          cancellation_submissions(where: {order_submission_id: {_eq: $orderSubmissionId}}) {
            id
          }
        }
      `

      const cancellationCheck = await graphqlRequest(checkCancellationQuery, { orderSubmissionId: submissionId }, true)

      const hasCancellationSubmission = cancellationCheck.data.cancellation_submissions.length > 0
      const cancellationDeadline = orderData.slot.cancellation_submission_deadline
        ? new Date(orderData.slot.cancellation_submission_deadline)
        : null

      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // 5 hours 30 minutes in milliseconds
      const now = Date.now()
      const cancellationDeadlineIST = cancellationDeadline ? cancellationDeadline.getTime() + IST_OFFSET_MS : null

      const shouldApplyPenalty = cancellationDeadlineIST && now > cancellationDeadlineIST && !hasCancellationSubmission

      let newIdAmount: number
      let oldIdAmount: number
      let totalCommission: number

      if (shouldApplyPenalty) {
        const newCancelledRate = orderData.slot.new_id_cancelled_commission || 7
        const oldCancelledRate = orderData.slot.old_id_cancelled_commission || 7

        newIdAmount = orderData.total_new_id_orders * newCancelledRate
        oldIdAmount = orderData.total_old_id_orders * oldCancelledRate
        totalCommission = newIdAmount + oldIdAmount
      } else {
        newIdAmount = orderData.total_new_id_orders * orderData.slot.new_id_success_commission
        oldIdAmount = orderData.total_old_id_orders * orderData.slot.old_id_success_commission
        totalCommission = newIdAmount + oldIdAmount
      }

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

      const approveResult = await graphqlRequest(approveOrderMutation, { id: submissionId }, true)

      if (approveResult.errors) {
        console.error("GraphQL errors approving order:", approveResult.errors)
        return NextResponse.json(
          { error: approveResult.errors[0]?.message || "Failed to approve order submission" },
          { status: 400 },
        )
      }

      await updateEmployeeStreak(orderData.employee_id)

      const checkCommissionQuery = `
        query CheckCommission($employeeId: uuid!, $slotId: uuid!) {
          commissions(where: {employee_id: {_eq: $employeeId}, slot_id: {_eq: $slotId}}) {
            id
            old_id_success_amount
            new_id_success_amount
            total_commission
          }
        }
      `

      const commissionCheck = await graphqlRequest(
        checkCommissionQuery,
        { employeeId: orderData.employee_id, slotId: orderData.slot_id },
        true,
      )

      if (commissionCheck.data.commissions.length > 0) {
        const existingCommission = commissionCheck.data.commissions[0]
        const updateCommissionMutation = `
          mutation UpdateCommission($id: uuid!, $newIdAmount: numeric!, $oldIdAmount: numeric!, $totalCommission: numeric!) {
            update_commissions_by_pk(
              pk_columns: { id: $id }
              _set: {
                new_id_success_amount: $newIdAmount
                old_id_success_amount: $oldIdAmount
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
            newIdAmount,
            oldIdAmount,
            totalCommission,
          },
          true,
        )
      } else {
        const createCommissionMutation = `
          mutation CreateCommission(
            $employeeId: uuid!
            $slotId: uuid!
            $orderSubmissionId: uuid!
            $newIdAmount: numeric!
            $oldIdAmount: numeric!
            $totalCommission: numeric!
          ) {
            insert_commissions_one(
              object: {
                employee_id: $employeeId
                slot_id: $slotId
                order_submission_id: $orderSubmissionId
                new_id_success_amount: $newIdAmount
                old_id_success_amount: $oldIdAmount
                old_id_cancelled_amount: 0
                new_id_cancelled_amount: 0
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
            orderSubmissionId: submissionId,
            newIdAmount,
            oldIdAmount,
            totalCommission,
          },
          true,
        )
      }

      return NextResponse.json({
        success: true,
        data: approveResult.data.update_order_submissions_by_pk,
        penaltyApplied: shouldApplyPenalty,
      })
    } else if (submissionType === "cancellation") {
      const getCancellationQuery = `
        query GetCancellationSubmission($id: uuid!) {
          cancellation_submissions_by_pk(id: $id) {
            id
            employee_id
            slot_id
            order_submission_id
            total_new_id_cancelled
            total_old_id_cancelled
            slot {
              new_id_cancelled_commission
              old_id_cancelled_commission
              new_id_success_commission
              old_id_success_commission
            }
            order_submission {
              total_new_id_orders
              total_old_id_orders
            }
          }
        }
      `

      const cancelResult = await graphqlRequest(getCancellationQuery, { id: submissionId }, true)

      if (cancelResult.errors || !cancelResult.data.cancellation_submissions_by_pk) {
        console.error("Failed to fetch cancellation submission details")
        return NextResponse.json({ error: "Cancellation submission not found" }, { status: 404 })
      }

      const cancelData = cancelResult.data.cancellation_submissions_by_pk

      const approveCancellationMutation = `
        mutation ApproveCancellationSubmission($id: uuid!) {
          update_cancellation_submissions_by_pk(
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

      const approveResult = await graphqlRequest(approveCancellationMutation, { id: submissionId }, true)

      if (approveResult.errors) {
        console.error("GraphQL errors approving cancellation:", approveResult.errors)
        return NextResponse.json(
          { error: approveResult.errors[0]?.message || "Failed to approve cancellation submission" },
          { status: 400 },
        )
      }

      const newIdCancelledAmount = cancelData.total_new_id_cancelled * cancelData.slot.new_id_cancelled_commission
      const oldIdCancelledAmount = cancelData.total_old_id_cancelled * cancelData.slot.old_id_cancelled_commission

      const newIdSuccess = cancelData.order_submission.total_new_id_orders - cancelData.total_new_id_cancelled
      const oldIdSuccess = cancelData.order_submission.total_old_id_orders - cancelData.total_old_id_cancelled

      const newIdSuccessAmount = newIdSuccess * cancelData.slot.new_id_success_commission
      const oldIdSuccessAmount = oldIdSuccess * cancelData.slot.old_id_success_commission

      const totalCommission = newIdSuccessAmount + oldIdSuccessAmount + newIdCancelledAmount + oldIdCancelledAmount

      const updateCommissionMutation = `
        mutation UpdateCommissionWithCancellation(
          $employeeId: uuid!
          $slotId: uuid!
          $newIdSuccessAmount: numeric!
          $oldIdSuccessAmount: numeric!
          $newIdCancelledAmount: numeric!
          $oldIdCancelledAmount: numeric!
          $totalCommission: numeric!
          $cancellationSubmissionId: uuid!
        ) {
          update_commissions(
            where: {employee_id: {_eq: $employeeId}, slot_id: {_eq: $slotId}}
            _set: {
              new_id_success_amount: $newIdSuccessAmount
              old_id_success_amount: $oldIdSuccessAmount
              new_id_cancelled_amount: $newIdCancelledAmount
              old_id_cancelled_amount: $oldIdCancelledAmount
              total_commission: $totalCommission
              cancellation_submission_id: $cancellationSubmissionId
              status: "approved"
              calculated_at: "now()"
            }
          ) {
            affected_rows
          }
        }
      `

      await graphqlRequest(
        updateCommissionMutation,
        {
          employeeId: cancelData.employee_id,
          slotId: cancelData.slot_id,
          newIdSuccessAmount,
          oldIdSuccessAmount,
          newIdCancelledAmount,
          oldIdCancelledAmount,
          totalCommission,
          cancellationSubmissionId: submissionId,
        },
        true,
      )

      return NextResponse.json({ success: true, data: approveResult.data.update_cancellation_submissions_by_pk })
    } else {
      return NextResponse.json({ error: "Invalid submission type" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error approving submission:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
