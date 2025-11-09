import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

// Get available slots for employees with their submission status
export async function GET(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get("employeeId")

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const now = Date.now()
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

    const query = `
      query GetAvailableSlots($employeeId: uuid!) {
        slots(order_by: { slot_date: desc }) {
          id
          name
          slot_date
          order_submission_deadline
          cancellation_submission_deadline
          old_id_success_commission
          old_id_cancelled_commission
          new_id_success_commission
          new_id_cancelled_commission
          status
          order_submissions(where: { employee_id: { _eq: $employeeId } }) {
            id
            approval_status
            total_orders
            total_new_id_orders
            total_old_id_orders
            submitted_at
          }
          cancellation_submissions(where: { employee_id: { _eq: $employeeId } }) {
            id
            approval_status
            submitted_at
          }
        }
      }
    `

    const result = await graphqlRequest(query, { employeeId }, true)

    if (result.errors) {
      console.error("GraphQL errors fetching slots:", result.errors)
      return NextResponse.json({ error: result.errors[0]?.message || "Failed to fetch slots" }, { status: 400 })
    }

    const slotsWithStatus = result.data.slots.map((slot: any) => {
      const orderDeadlineUTC = new Date(slot.order_submission_deadline).getTime()
      const cancellationDeadlineUTC = new Date(slot.cancellation_submission_deadline).getTime()

      const orderDeadlineIST = orderDeadlineUTC + IST_OFFSET_MS
      const cancellationDeadlineIST = cancellationDeadlineUTC + IST_OFFSET_MS

      let computedStatus = "upcoming"
      if (now > cancellationDeadlineIST) {
        computedStatus = "past"
      } else if (now > orderDeadlineIST) {
        computedStatus = "active"
      } else {
        computedStatus = "active"
      }

      return {
        ...slot,
        computedStatus,
      }
    })

    return NextResponse.json({ data: slotsWithStatus, serverTime: new Date(now).toISOString() })
  } catch (error: any) {
    console.error("Error fetching slots:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
