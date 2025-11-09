import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

// Reject a submission (order or cancellation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissionId, submissionType, reason } = body // submissionType: "order" | "cancellation"

    console.log("[v0] Rejecting submission:", submissionId, "Type:", submissionType, "Reason:", reason)

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    if (submissionType === "order") {
      const mutation = `
        mutation RejectOrderSubmission($id: uuid!, $reason: String!) {
          update_order_submissions_by_pk(
            pk_columns: { id: $id }
            _set: {
              approval_status: "rejected"
              rejection_reason: $reason
            }
          ) {
            id
            approval_status
            rejection_reason
          }
        }
      `

      const result = await graphqlRequest(mutation, { id: submissionId, reason }, true)

      if (result.errors) {
        console.error("[v0] GraphQL errors:", result.errors)
        return NextResponse.json(
          { error: result.errors[0]?.message || "Failed to reject order submission" },
          { status: 400 },
        )
      }

      console.log("[v0] Order submission rejected successfully")
      return NextResponse.json({ success: true, data: result.data.update_order_submissions_by_pk })
    } else if (submissionType === "cancellation") {
      const mutation = `
        mutation RejectCancellationSubmission($id: uuid!, $reason: String!) {
          update_cancellation_submissions_by_pk(
            pk_columns: { id: $id }
            _set: {
              approval_status: "rejected"
              rejection_reason: $reason
            }
          ) {
            id
            approval_status
            rejection_reason
          }
        }
      `

      const result = await graphqlRequest(mutation, { id: submissionId, reason }, true)

      if (result.errors) {
        console.error("[v0] GraphQL errors:", result.errors)
        return NextResponse.json(
          { error: result.errors[0]?.message || "Failed to reject cancellation submission" },
          { status: 400 },
        )
      }

      console.log("[v0] Cancellation submission rejected successfully")
      return NextResponse.json({ success: true, data: result.data.update_cancellation_submissions_by_pk })
    } else {
      return NextResponse.json({ error: "Invalid submission type" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[v0] Error rejecting submission:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
