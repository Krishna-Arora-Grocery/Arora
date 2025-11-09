import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

// Get employee dashboard stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const query = `
      query GetEmployeeStats($employeeId: uuid!) {
        order_submissions_aggregate(where: { employee_id: { _eq: $employeeId } }) {
          aggregate {
            count
            sum {
              total_orders
              total_old_id_orders
              total_new_id_orders
            }
          }
        }
        approved_orders: order_submissions_aggregate(
          where: { employee_id: { _eq: $employeeId }, approval_status: { _eq: "approved" } }
        ) {
          aggregate {
            count
            sum {
              total_orders
            }
          }
        }
        pending_orders: order_submissions_aggregate(
          where: { employee_id: { _eq: $employeeId }, approval_status: { _eq: "pending" } }
        ) {
          aggregate {
            count
          }
        }
        cancellation_submissions_aggregate(where: { employee_id: { _eq: $employeeId } }) {
          aggregate {
            count
            sum {
              total_cancelled
            }
          }
        }
        commissions_aggregate(
          where: { employee_id: { _eq: $employeeId }, status: { _eq: "approved" } }
        ) {
          aggregate {
            sum {
              total_commission
            }
          }
        }
      }
    `

    const result = await graphqlRequest(query, { employeeId }, true)

    if (result.errors) {
      console.error("[v0] GraphQL errors:", result.errors)
      return NextResponse.json(
        { error: result.errors[0]?.message || "Failed to fetch employee stats" },
        { status: 400 },
      )
    }

    const stats = {
      totalOrders: result.data.order_submissions_aggregate.aggregate.sum?.total_orders || 0,
      approvedOrders: result.data.approved_orders.aggregate.sum?.total_orders || 0,
      pendingOrders: result.data.pending_orders.aggregate.count || 0,
      totalCancellations: result.data.cancellation_submissions_aggregate.aggregate.sum?.total_cancelled || 0,
      totalEarnings: result.data.commissions_aggregate.aggregate.sum?.total_commission || 0,
    }

    return NextResponse.json({ data: stats })
  } catch (error: any) {
    console.error("[v0] Error fetching employee stats:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
