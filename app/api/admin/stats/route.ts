import { type NextRequest, NextResponse } from "next/server"

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7)
    const part = Number.parseInt(searchParams.get("part") || "1")

    console.log("[v0] Fetching admin dashboard stats for:", { month, part })

    const [year, monthNum] = month.split("-")
    let startDate, endDate

    if (part === 1) {
      startDate = `${year}-${monthNum}-01`
      endDate = `${year}-${monthNum}-10`
    } else if (part === 2) {
      startDate = `${year}-${monthNum}-11`
      endDate = `${year}-${monthNum}-20`
    } else {
      startDate = `${year}-${monthNum}-21`
      const lastDay = new Date(Number.parseInt(year), Number.parseInt(monthNum), 0).getDate()
      endDate = `${year}-${monthNum}-${lastDay}`
    }

    console.log("[v0] Date range:", { startDate, endDate })

    const query = `
      query GetDashboardStats($startDate: timestamp!, $endDate: timestamp!) {
        employees_aggregate {
          aggregate {
            count
          }
        }
        pending_orders: order_submissions_aggregate(
          where: { 
            approval_status: { _eq: "pending" },
            submitted_at: { _gte: $startDate, _lte: $endDate }
          }
        ) {
          aggregate {
            count
          }
        }
        
        commissions(
          where: {
            calculated_at: { _gte: $startDate, _lte: $endDate }
          }
          order_by: { calculated_at: asc }
        ) {
          id
          employee_id
          order_submission_id
          new_id_success_amount
          old_id_success_amount
          new_id_cancelled_amount
          old_id_cancelled_amount
          total_commission
          calculated_at
          order_submission {
            total_orders
            total_new_id_orders
            total_old_id_orders
          }
          cancellation_submission {
            total_cancelled
            total_new_id_cancelled
            total_old_id_cancelled
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
        variables: { startDate, endDate },
      }),
    })

    const result = await response.json()

    if (result.errors) {
      console.error("[v0] Dashboard stats error:", result.errors)
      return NextResponse.json({ error: result.errors[0]?.message || "Failed to fetch stats" }, { status: 400 })
    }

    const commissions = result.data.commissions || []
    let totalPlaced = 0
    let totalCancelled = 0
    let totalCommission = 0

    const dailyData: Record<
      string,
      {
        commission: number
        placed: number
        cancelled: number
      }
    > = {}

    commissions.forEach((comm: any) => {
      const date = comm.calculated_at.split("T")[0]
      const day = new Date(comm.calculated_at).getDate()

      if (!dailyData[day]) {
        dailyData[day] = { commission: 0, placed: 0, cancelled: 0 }
      }

      const isPenalty =
        comm.new_id_success_amount === 0 &&
        comm.old_id_success_amount === 0 &&
        (comm.new_id_cancelled_amount > 0 || comm.old_id_cancelled_amount > 0)

      if (isPenalty) {
        const totalOrders = comm.order_submission?.total_orders || 0
        totalCancelled += totalOrders
        dailyData[day].cancelled += totalOrders
      } else {
        const totalOrders = comm.order_submission?.total_orders || 0
        const cancelled = comm.cancellation_submission?.total_cancelled || 0
        const placed = totalOrders - cancelled

        totalPlaced += placed
        totalCancelled += cancelled
        dailyData[day].placed += placed
        dailyData[day].cancelled += cancelled
      }

      const commAmount = Number(comm.total_commission) || 0
      totalCommission += commAmount
      dailyData[day].commission += commAmount
    })

    const dailyDataArray = Object.entries(dailyData)
      .map(([day, data]) => ({
        day: Number.parseInt(day),
        ...data,
      }))
      .sort((a, b) => a.day - b.day)

    console.log("[v0] Processed stats:", {
      totalPlaced,
      totalCancelled,
      totalCommission,
      dailyDataPoints: dailyDataArray.length,
    })

    return NextResponse.json({
      data: {
        employees_aggregate: result.data.employees_aggregate,
        pending_orders: result.data.pending_orders,
        ordersPlaced: totalPlaced,
        ordersCancelled: totalCancelled,
        totalOrders: totalPlaced + totalCancelled,
        totalCommission,
        dailyData: dailyDataArray,
      },
    })
  } catch (error: any) {
    console.error("[v0] Dashboard stats error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 })
  }
}
