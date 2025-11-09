import { type NextRequest, NextResponse } from "next/server"

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, month, year } = body

    // Calculate date ranges for the selected month
    const selectedMonth = Number.parseInt(month)
    const selectedYear = Number.parseInt(year)

    const monthStart = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`
    const monthEnd = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0]

    const query = `
      query GetDashboardStats($employeeId: uuid!) {
        # Lifetime stats - sum all approved commissions
        lifetimeEarnings: commissions_aggregate(
          where: {
            employee_id: {_eq: $employeeId}
            status: {_in: ["approved", "paid"]}
          }
        ) {
          aggregate {
            sum {
              total_commission
            }
          }
        }
        
        lifetimeOrders: order_submissions_aggregate(
          where: {
            employee_id: {_eq: $employeeId}
            approval_status: {_eq: "approved"}
          }
        ) {
          aggregate {
            sum {
              total_orders
            }
          }
        }
        
        monthEarnings: commissions_aggregate(
          where: {
            employee_id: {_eq: $employeeId}
            status: {_in: ["approved", "paid"]}
            order_submission: {
              slot: {
                slot_date: {_gte: "${monthStart}", _lte: "${monthEnd}"}
              }
            }
          }
        ) {
          aggregate {
            sum {
              total_commission
            }
          }
        }
        
        # Employee streak
        employee: employees_by_pk(id: $employeeId) {
          streak
          status
        }
        
        submissions: order_submissions(
          where: {
            employee_id: {_eq: $employeeId}
            approval_status: {_eq: "approved"}
            slot: {
              slot_date: {_gte: "${monthStart}", _lte: "${monthEnd}"}
            }
          }
          order_by: {slot: {slot_date: asc}}
        ) {
          id
          total_orders
          total_old_id_orders
          total_new_id_orders
          slot {
            slot_date
          }
          cancellation_submissions {
            id
            approval_status
            total_cancelled
          }
        }
        
        # All commissions for this month to join with submissions
        commissions: commissions(
          where: {
            employee_id: {_eq: $employeeId}
            status: {_in: ["approved", "paid"]}
            order_submission: {
              slot: {
                slot_date: {_gte: "${monthStart}", _lte: "${monthEnd}"}
              }
            }
          }
        ) {
          order_submission_id
          total_commission
          new_id_success_amount
          old_id_success_amount
          new_id_cancelled_amount
          old_id_cancelled_amount
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
      console.error("GraphQL errors:", result.errors)
      return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
    }

    const data = result.data

    const commissionMap = new Map<string, number>()
    const penaltyMap = new Map<string, boolean>()
    data.commissions.forEach((commission: any) => {
      commissionMap.set(commission.order_submission_id, commission.total_commission || 0)

      const isPenalty =
        (commission.new_id_success_amount === 0 || commission.new_id_success_amount === null) &&
        (commission.old_id_success_amount === 0 || commission.old_id_success_amount === null) &&
        (commission.new_id_cancelled_amount > 0 || commission.old_id_cancelled_amount > 0)

      penaltyMap.set(commission.order_submission_id, isPenalty)
    })

    const submissionsByDate = new Map<string, { orders: number; oldId: number; newId: number; earnings: number }>()
    const cancellationsByDate = new Map<string, number>()

    data.submissions.forEach((submission: any) => {
      const cancellationSubmission = submission.cancellation_submissions?.[0]

      if (cancellationSubmission && cancellationSubmission.approval_status !== "approved") {
        return
      }

      const slotDate = submission.slot.slot_date
      const existing = submissionsByDate.get(slotDate) || { orders: 0, oldId: 0, newId: 0, earnings: 0 }

      const commissionAmount = commissionMap.get(submission.id) || 0
      const isPenaltyApplied = penaltyMap.get(submission.id) || false

      submissionsByDate.set(slotDate, {
        orders: existing.orders + (submission.total_orders || 0),
        oldId: existing.oldId + (submission.total_old_id_orders || 0),
        newId: existing.newId + (submission.total_new_id_orders || 0),
        earnings: existing.earnings + commissionAmount,
      })

      if (isPenaltyApplied) {
        const existingCancelled = cancellationsByDate.get(slotDate) || 0
        cancellationsByDate.set(slotDate, existingCancelled + (submission.total_orders || 0))
      } else if (cancellationSubmission && cancellationSubmission.approval_status === "approved") {
        const existingCancelled = cancellationsByDate.get(slotDate) || 0
        cancellationsByDate.set(slotDate, existingCancelled + (cancellationSubmission.total_cancelled || 0))
      }
    })

    const period1Data: any[] = []
    const period2Data: any[] = []
    const period3Data: any[] = []

    submissionsByDate.forEach((value, slotDate) => {
      const day = new Date(slotDate).getDate()
      const cancelled = cancellationsByDate.get(slotDate) || 0

      const dataPoint = {
        date: slotDate,
        orders: value.orders,
        cancelled,
        earnings: value.earnings,
      }

      if (day >= 1 && day <= 10) {
        period1Data.push(dataPoint)
      } else if (day >= 11 && day <= 20) {
        period2Data.push(dataPoint)
      } else {
        period3Data.push(dataPoint)
      }
    })

    // Calculate aggregates for each period
    const calculatePeriodStats = (periodData: any[]) => {
      const totalOrders = periodData.reduce((sum, d) => sum + d.orders, 0)
      const totalCancelled = periodData.reduce((sum, d) => sum + d.cancelled, 0)
      const totalEarnings = periodData.reduce((sum, d) => sum + d.earnings, 0)

      return {
        earnings: totalEarnings,
        placed: totalOrders - totalCancelled,
        cancelled: totalCancelled,
        dailyData: periodData.map((d) => ({
          date: d.date,
          earnings: d.earnings,
          orders: d.orders,
          cancelled: d.cancelled,
        })),
      }
    }

    const dashboardData = {
      lifetimeEarnings: data.lifetimeEarnings.aggregate.sum.total_commission || 0,
      lifetimeOrders: data.lifetimeOrders.aggregate.sum.total_orders || 0,
      monthEarnings: data.monthEarnings.aggregate.sum.total_commission || 0,
      activeStreak: data.employee?.streak || 0,
      periods: {
        period1: calculatePeriodStats(period1Data),
        period2: calculatePeriodStats(period2Data),
        period3: calculatePeriodStats(period3Data),
      },
    }

    return NextResponse.json(dashboardData)
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
