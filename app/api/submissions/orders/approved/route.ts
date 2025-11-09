import { type NextRequest, NextResponse } from "next/server"

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!

export async function GET(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get("employeeId")

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    console.log("[v0] Fetching approved order submissions for employee:", employeeId)

    const query = `
      query GetApprovedOrderSubmissions($employeeId: uuid!) {
        order_submissions(
          where: {
            employee_id: { _eq: $employeeId }
            approval_status: { _eq: "approved" }
          }
          order_by: { submitted_at: desc }
        ) {
          id
          slot_id
          total_orders
          total_old_id_orders
          total_new_id_orders
          approval_status
          approved_at
          submitted_at
          slot {
            id
            name
            slot_date
            order_submission_deadline
            cancellation_submission_deadline
            new_id_success_commission
            new_id_cancelled_commission
            old_id_success_commission
            old_id_cancelled_commission
          }
          order_details {
            id
            pincode
            id_type
            order_count
          }
          cancellation_submissions {
            id
            approval_status
            total_cancelled
            total_old_id_cancelled
            total_new_id_cancelled
            submitted_at
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
      console.error("[SERVER] [v0] GraphQL errors:", result.errors)
      return NextResponse.json({ error: result.errors[0].message }, { status: 400 })
    }

    console.log("[v0] Approved order submissions fetched:", result.data.order_submissions.length)

    return NextResponse.json({ orders: result.data.order_submissions })
  } catch (error) {
    console.error("[v0] Error fetching approved order submissions:", error)
    return NextResponse.json({ error: "Failed to fetch approved order submissions" }, { status: 500 })
  }
}
