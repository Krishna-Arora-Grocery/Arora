import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

// Get employee payment data for a specific month part
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") // Format: "2025-11"
    const part = searchParams.get("part") // "1", "2", or "3"

    console.log("[v0] Fetching payment data for month:", month, "part:", part)

    // Calculate date range based on month part
    let startDate: string
    let endDate: string

    if (month && part) {
      const [year, monthNum] = month.split("-")
      const partNum = Number.parseInt(part)

      if (partNum === 1) {
        startDate = `${year}-${monthNum}-01`
        endDate = `${year}-${monthNum}-10`
      } else if (partNum === 2) {
        startDate = `${year}-${monthNum}-11`
        endDate = `${year}-${monthNum}-20`
      } else {
        startDate = `${year}-${monthNum}-21`
        // Get last day of month
        const lastDay = new Date(Number.parseInt(year), Number.parseInt(monthNum), 0).getDate()
        endDate = `${year}-${monthNum}-${lastDay}`
      }
    } else {
      // Default to current month, part 1
      const now = new Date()
      const year = now.getFullYear()
      const monthNum = String(now.getMonth() + 1).padStart(2, "0")
      startDate = `${year}-${monthNum}-01`
      endDate = `${year}-${monthNum}-10`
    }

    console.log("[v0] Date range:", startDate, "to", endDate)

    const query = `
      query GetEmployeePayments($startDate: date!, $endDate: date!) {
        employees(
          where: {
            total_ids_given: { _gt: 0 }
          }
        ) {
          id
          name
          username
          email
          total_ids_given
          commissions(
            where: {
              date: { _gte: $startDate, _lte: $endDate }
              status: { _eq: "approved" }
            }
          ) {
            id
            date
            total_commission
            payment_status
            paid_at
            old_id_success_amount
            new_id_success_amount
            old_id_cancelled_amount
            new_id_cancelled_amount
            slot {
              id
              name
              slot_date
            }
          }
        }
      }
    `

    const result = await graphqlRequest(
      query,
      {
        startDate: startDate,
        endDate: endDate,
      },
      true,
    )

    if (result.errors) {
      console.error("[v0] GraphQL errors:", result.errors)
      return NextResponse.json({ error: result.errors[0]?.message || "Failed to fetch payment data" }, { status: 400 })
    }

    // Calculate earnings for each employee
    const employeePayments = result.data.employees.map((employee: any) => {
      const dayWiseMap = new Map<number, { earning: number; orders: number; cancelled: number }>()

      const partNum = Number.parseInt(part || "1")
      const startDay = partNum === 1 ? 1 : partNum === 2 ? 11 : 21
      const endDay = partNum === 1 ? 10 : partNum === 2 ? 20 : 30

      for (let day = startDay; day <= endDay; day++) {
        dayWiseMap.set(day, { earning: 0, orders: 0, cancelled: 0 })
      }

      let totalEarning = 0
      let paidAmount = 0
      let pendingAmount = 0

      employee.commissions.forEach((commission: any) => {
        const commissionDate = new Date(commission.date)
        const day = commissionDate.getDate()

        const earning = Number(commission.total_commission)
        totalEarning += earning

        if (commission.payment_status === "paid") {
          paidAmount += earning
        } else {
          pendingAmount += earning
        }

        if (dayWiseMap.has(day)) {
          const dayData = dayWiseMap.get(day)!
          dayData.earning += earning
          // Approximate order counts from commission amounts
          const successOrders = Math.round(
            (Number(commission.new_id_success_amount) + Number(commission.old_id_success_amount)) / 15,
          )
          const cancelledOrders = Math.round(
            (Number(commission.new_id_cancelled_amount) + Number(commission.old_id_cancelled_amount)) / 7,
          )
          dayData.orders += successOrders
          dayData.cancelled += cancelledOrders
        }
      })

      const dayWiseData = Array.from(dayWiseMap.entries())
        .map(([day, data]) => ({
          day,
          ...data,
        }))
        .sort((a, b) => a.day - b.day)

      let status: "pending" | "processing" | "paid"
      if (paidAmount === totalEarning && totalEarning > 0) {
        status = "paid"
      } else if (paidAmount > 0) {
        status = "processing"
      } else {
        status = "pending"
      }

      const paidCommissions = employee.commissions
        .filter((c: any) => c.payment_status === "paid" && c.paid_at)
        .map((c: any) => new Date(c.paid_at))

      const lastPaid =
        paidCommissions.length > 0
          ? new Date(Math.max(...paidCommissions.map((d: Date) => d.getTime()))).toISOString().split("T")[0]
          : "N/A"

      return {
        id: employee.id,
        name: employee.name,
        totalEarning: Math.round(totalEarning),
        pendingAmount: Math.round(pendingAmount),
        paidAmount: Math.round(paidAmount),
        status,
        lastPaid,
        dayWiseData,
      }
    })

    // Filter out employees with no submissions for this period
    const filteredPayments = employeePayments.filter((emp: any) => emp.totalEarning > 0)

    console.log("[v0] Employees with payment data:", filteredPayments.length)

    return NextResponse.json({ employees: filteredPayments })
  } catch (error: any) {
    console.error("[v0] Error fetching payment data:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
