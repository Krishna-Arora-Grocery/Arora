import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

// Get all employees with pending submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") // Format: "2025-11"
    const part = searchParams.get("part") // "1", "2", or "3"

    // Calculate date range based on month part
    let startDate: string
    let endDate: string

    if (month && part) {
      const [year, monthNum] = month.split("-")
      const partNum = Number.parseInt(part)

      if (partNum === 1) {
        startDate = `${year}-${monthNum}-01`
        endDate = `${year}-${monthNum}-10`
      } else if (partNum === 2) {
        startDate = `${year}-${monthNum}-11`
        endDate = `${year}-${monthNum}-20`
      } else {
        startDate = `${year}-${monthNum}-21`
        // Get last day of month
        const lastDay = new Date(Number.parseInt(year), Number.parseInt(monthNum), 0).getDate()
        endDate = `${year}-${monthNum}-${lastDay}`
      }
    } else {
      // Default to current month, part 1
      const now = new Date()
      const year = now.getFullYear()
      const monthNum = String(now.getMonth() + 1).padStart(2, "0")
      startDate = `${year}-${monthNum}-01`
      endDate = `${year}-${monthNum}-10`
    }

    const query = `
      query GetPendingApprovals($startDate: date!, $endDate: date!) {
        employees(
          where: {
            total_ids_given: { _gt: 0 }
            _or: [
              {
                order_submissions: {
                  approval_status: { _eq: "pending" }
                  slot: {
                    slot_date: { _gte: $startDate, _lte: $endDate }
                  }
                }
              }
              {
                cancellation_submissions: {
                  approval_status: { _eq: "pending" }
                  slot: {
                    slot_date: { _gte: $startDate, _lte: $endDate }
                  }
                }
              }
            ]
          }
        ) {
          id
          name
          username
          email
          total_ids_given
          order_submissions(
            where: {
              approval_status: { _eq: "pending" }
              slot: {
                slot_date: { _gte: $startDate, _lte: $endDate }
              }
            }
          ) {
            id
            slot_id
            total_orders
            total_old_id_orders
            total_new_id_orders
            approval_status
            submitted_at
            slot {
              id
              name
              slot_date
              cancellation_submission_deadline
              new_id_success_commission
              old_id_success_commission
              new_id_cancelled_commission
              old_id_cancelled_commission
            }
            order_details {
              id
              pincode
              id_type
              order_count
            }
          }
          cancellation_submissions(
            where: {
              approval_status: { _eq: "pending" }
              slot: {
                slot_date: { _gte: $startDate, _lte: $endDate }
              }
            }
          ) {
            id
            slot_id
            order_submission_id
            total_cancelled
            total_old_id_cancelled
            total_new_id_cancelled
            approval_status
            submitted_at
            slot {
              id
              name
              slot_date
              cancellation_submission_deadline
              new_id_success_commission
              old_id_success_commission
              new_id_cancelled_commission
              old_id_cancelled_commission
            }
            order_submission {
              id
              total_orders
              total_old_id_orders
              total_new_id_orders
              approval_status
              submitted_at
              order_details {
                id
                pincode
                id_type
                order_count
              }
            }
            cancellation_details {
              id
              pincode
              id_type
              cancelled_count
              order_detail_id
            }
          }
        }
      }
    `

    const result = await graphqlRequest(
      query,
      {
        startDate: startDate,
        endDate: endDate,
      },
      true,
    )

    if (result.errors) {
      console.error("GraphQL errors fetching pending approvals:", result.errors)
      return NextResponse.json(
        { error: result.errors[0]?.message || "Failed to fetch pending approvals" },
        { status: 400 },
      )
    }

    const now = new Date()
    const employeesWithCounts = result.data.employees.map((employee: any) => {
      // Process order submissions to check for penalties
      const processedOrderSubmissions = employee.order_submissions.map((orderSub: any) => {
        const cancellationDeadline = orderSub.slot.cancellation_submission_deadline
          ? new Date(orderSub.slot.cancellation_submission_deadline)
          : null

        // Check if this order has a cancellation submission
        const hasCancellationSubmission = employee.cancellation_submissions.some(
          (cancelSub: any) => cancelSub.order_submission_id === orderSub.id,
        )

        const hasPenalty = cancellationDeadline && now > cancellationDeadline && !hasCancellationSubmission

        let penaltyCommission = null
        if (hasPenalty) {
          // Use cancelled commission rate (typically same for both old and new, so pick one)
          const cancelledRate =
            orderSub.slot.old_id_cancelled_commission || orderSub.slot.new_id_cancelled_commission || 7
          penaltyCommission = orderSub.total_orders * cancelledRate
        }

        return {
          ...orderSub,
          hasPenalty,
          penaltyCommission,
        }
      })

      // Get unique slot IDs from both order and cancellation submissions
      const uniqueSlotIds = new Set<string>()

      employee.order_submissions.forEach((sub: any) => {
        uniqueSlotIds.add(sub.slot_id)
      })

      employee.cancellation_submissions.forEach((sub: any) => {
        uniqueSlotIds.add(sub.slot_id)
      })

      return {
        ...employee,
        order_submissions: processedOrderSubmissions,
        pendingSlotCount: uniqueSlotIds.size,
      }
    })

    return NextResponse.json({ employees: employeesWithCounts })
  } catch (error: any) {
    console.error("Error fetching pending approvals:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
