import { type NextRequest, NextResponse } from "next/server"

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log("[v0] Fetching cancellation submission:", id)

    const query = `
      query GetCancellationSubmission($id: uuid!) {
        cancellation_submissions_by_pk(id: $id) {
          id
          employee_id
          slot_id
          order_submission_id
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
            order_detail {
              order_count
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
        variables: { id },
      }),
    })

    const result = await response.json()

    if (result.errors) {
      console.error("[v0] GraphQL errors:", JSON.stringify(result.errors))
      return NextResponse.json({ error: "Failed to fetch cancellation submission" }, { status: 500 })
    }

    const cancellation = result.data.cancellation_submissions_by_pk

    if (!cancellation) {
      return NextResponse.json({ error: "Cancellation submission not found" }, { status: 404 })
    }

    console.log("[v0] Cancellation submission fetched successfully")

    return NextResponse.json({ cancellation })
  } catch (error) {
    console.error("[v0] Error fetching cancellation submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
