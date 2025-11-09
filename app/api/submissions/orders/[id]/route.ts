import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

// Get existing order submission details for editing
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const submissionId = params.id

    console.log("[v0] Fetching submission details:", submissionId)

    const query = `
      query GetSubmissionDetails($submissionId: uuid!) {
        order_submissions_by_pk(id: $submissionId) {
          id
          employee_id
          slot_id
          total_orders
          total_new_id_orders
          total_old_id_orders
          approval_status
          submitted_at
          order_details {
            id
            pincode
            id_type
            order_count
          }
        }
      }
    `

    const result = await graphqlRequest(query, { submissionId }, true)

    if (result.errors) {
      console.error("[SERVER] [v0] GraphQL errors:", result.errors)
      return NextResponse.json({ error: result.errors[0]?.message || "Failed to fetch submission" }, { status: 400 })
    }

    return NextResponse.json({ data: result.data.order_submissions_by_pk })
  } catch (error: any) {
    console.error("[SERVER] [v0] Error fetching submission:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// Update existing order submission
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const submissionId = params.id
    const body = await request.json()
    const { orderDetails } = body

    console.log("[v0] Updating order submission:", submissionId)

    // Calculate totals
    let totalOrders = 0
    let totalNewIdOrders = 0
    let totalOldIdOrders = 0

    orderDetails.forEach((detail: any) => {
      totalOrders += detail.orderCount
      if (detail.idType === "new") {
        totalNewIdOrders += detail.orderCount
      } else {
        totalOldIdOrders += detail.orderCount
      }
    })

    // First, delete existing order details
    const deleteQuery = `
      mutation DeleteOrderDetails($submissionId: uuid!) {
        delete_order_details(where: { order_submission_id: { _eq: $submissionId } }) {
          affected_rows
        }
      }
    `

    await graphqlRequest(deleteQuery, { submissionId }, true)

    // Update the submission totals
    const updateSubmissionQuery = `
      mutation UpdateSubmission($submissionId: uuid!, $totalOrders: Int!, $totalNewIdOrders: Int!, $totalOldIdOrders: Int!) {
        update_order_submissions_by_pk(
          pk_columns: { id: $submissionId }
          _set: {
            total_orders: $totalOrders
            total_new_id_orders: $totalNewIdOrders
            total_old_id_orders: $totalOldIdOrders
            submitted_at: "now()"
          }
        ) {
          id
        }
      }
    `

    await graphqlRequest(updateSubmissionQuery, { submissionId, totalOrders, totalNewIdOrders, totalOldIdOrders }, true)

    // Insert new order details
    const insertDetailsQuery = `
      mutation InsertOrderDetails($objects: [order_details_insert_input!]!) {
        insert_order_details(objects: $objects) {
          affected_rows
        }
      }
    `

    const detailsObjects = orderDetails.map((detail: any) => ({
      order_submission_id: submissionId,
      pincode: detail.pincode,
      id_type: detail.idType,
      order_count: detail.orderCount,
    }))

    await graphqlRequest(insertDetailsQuery, { objects: detailsObjects }, true)

    console.log("[v0] Order submission updated successfully")

    return NextResponse.json({ success: true, submissionId })
  } catch (error: any) {
    console.error("[SERVER] [v0] Error updating submission:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
