import { type NextRequest, NextResponse } from "next/server"

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!

export async function GET(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get("employeeId")

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const now = Date.now()
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

    const query = `
      query GetSlotsForCancellation($employeeId: uuid!) {
        slots(order_by: { slot_date: desc }) {
          id
          name
          slot_date
          order_submission_deadline
          cancellation_submission_deadline
          new_id_success_commission
          new_id_cancelled_commission
          old_id_success_commission
          old_id_cancelled_commission
          order_submissions(where: { employee_id: { _eq: $employeeId } }) {
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
            cancellation_submissions {
              id
              total_cancelled
              total_old_id_cancelled
              total_new_id_cancelled
              approval_status
              submitted_at
              cancellation_details {
                id
                order_detail_id
                pincode
                id_type
                cancelled_count
              }
            }
          }
        }
      }
    `

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        query,
        variables: { employeeId },
      }),
    })

    const result = await response.json()

    if (result.errors) {
      console.error("GraphQL errors fetching cancellation slots:", result.errors)
      return NextResponse.json({ error: result.errors[0].message }, { status: 400 })
    }

    const slotsWithStatus = result.data.slots.map((slot: any) => {
      const cancellationDeadlineUTC = new Date(slot.cancellation_submission_deadline).getTime()
      const orderDeadlineUTC = new Date(slot.order_submission_deadline).getTime()

      const cancellationDeadlineIST = cancellationDeadlineUTC + IST_OFFSET_MS
      const orderDeadlineIST = orderDeadlineUTC + IST_OFFSET_MS

      let computedStatus = "active"
      if (now > cancellationDeadlineIST) {
        computedStatus = "past"
      }

      return {
        ...slot,
        computedStatus,
      }
    })

    return NextResponse.json({ slots: slotsWithStatus, serverTime: new Date(now).toISOString() })
  } catch (error) {
    console.error("Error fetching slots for cancellation:", error)
    return NextResponse.json({ error: "Failed to fetch slots for cancellation" }, { status: 500 })
  }
}
