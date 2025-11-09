import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

// Create order submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, slotId, orderDetails } = body

    console.log("[v0] Creating order submission:", { employeeId, slotId, orderDetails })

    // Calculate totals
    const totalOldIdOrders = orderDetails
      .filter((d: any) => d.idType === "old")
      .reduce((sum: number, d: any) => sum + d.orderCount, 0)

    const totalNewIdOrders = orderDetails
      .filter((d: any) => d.idType === "new")
      .reduce((sum: number, d: any) => sum + d.orderCount, 0)

    const totalOrders = totalOldIdOrders + totalNewIdOrders

    // Create order submission
    const mutation = `
      mutation CreateOrderSubmission($object: order_submissions_insert_input!) {
        insert_order_submissions_one(object: $object) {
          id
          employee_id
          slot_id
          total_orders
          total_old_id_orders
          total_new_id_orders
          approval_status
          submitted_at
        }
      }
    `

    const variables = {
      object: {
        employee_id: employeeId,
        slot_id: slotId,
        total_orders: totalOrders,
        total_old_id_orders: totalOldIdOrders,
        total_new_id_orders: totalNewIdOrders,
        approval_status: "pending",
        submitted_at: new Date().toISOString(),
      },
    }

    const result = await graphqlRequest(mutation, variables, true)

    if (result.errors) {
      console.error("[v0] GraphQL errors:", result.errors)
      return NextResponse.json(
        { error: result.errors[0]?.message || "Failed to create order submission" },
        { status: 400 },
      )
    }

    const submissionId = result.data.insert_order_submissions_one.id

    // Create order details
    const detailsMutation = `
      mutation CreateOrderDetails($objects: [order_details_insert_input!]!) {
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

    const detailsResult = await graphqlRequest(detailsMutation, { objects: detailsObjects }, true)

    if (detailsResult.errors) {
      console.error("[v0] Error creating order details:", detailsResult.errors)
    }

    console.log("[v0] Order submission created successfully:", submissionId)

    return NextResponse.json({
      success: true,
      submissionId,
      data: result.data.insert_order_submissions_one,
    })
  } catch (error: any) {
    console.error("[v0] Error creating order submission:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// Get order submissions for an employee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const query = `
      query GetOrderSubmissions($employeeId: uuid!) {
        order_submissions(
          where: { employee_id: { _eq: $employeeId } }
          order_by: { submitted_at: desc }
        ) {
          id
          slot_id
          total_orders
          total_old_id_orders
          total_new_id_orders
          approval_status
          submitted_at
          approved_at
          slot {
            id
            slot_name
            slot_date
          }
          order_details {
            id
            pincode
            id_type
            order_count
          }
        }
      }
    `

    const result = await graphqlRequest(query, { employeeId }, true)

    if (result.errors) {
      console.error("[v0] GraphQL errors:", result.errors)
      return NextResponse.json(
        { error: result.errors[0]?.message || "Failed to fetch order submissions" },
        { status: 400 },
      )
    }

    return NextResponse.json({ data: result.data.order_submissions })
  } catch (error: any) {
    console.error("[v0] Error fetching order submissions:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
