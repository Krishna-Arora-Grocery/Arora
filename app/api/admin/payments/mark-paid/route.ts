import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

// Mark employee commissions as paid for a specific period
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, month, part, adminId } = body

    console.log("[v0] Marking payment as paid:", { employeeId, month, part, adminId })

    if (!employeeId || !month || !part || !adminId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate date range based on month part
    const [year, monthNum] = month.split("-")
    const partNum = Number.parseInt(part)

    let startDate: string
    let endDate: string

    if (partNum === 1) {
      startDate = `${year}-${monthNum}-01`
      endDate = `${year}-${monthNum}-10`
    } else if (partNum === 2) {
      startDate = `${year}-${monthNum}-11`
      endDate = `${year}-${monthNum}-20`
    } else {
      startDate = `${year}-${monthNum}-21`
      const lastDay = new Date(Number.parseInt(year), Number.parseInt(monthNum), 0).getDate()
      endDate = `${year}-${monthNum}-${lastDay}`
    }

    // Update all commissions for this employee and period to paid
    const mutation = `
      mutation MarkCommissionsPaid(
        $employeeId: uuid!
        $startDate: date!
        $endDate: date!
        $adminId: uuid!
      ) {
        update_commissions(
          where: {
            employee_id: { _eq: $employeeId }
            date: { _gte: $startDate, _lte: $endDate }
            payment_status: { _eq: "pending" }
          }
          _set: {
            payment_status: "paid"
            paid_at: "now()"
            paid_by: $adminId
            payment_period: ${partNum}
          }
        ) {
          affected_rows
          returning {
            id
            payment_status
            paid_at
          }
        }
      }
    `

    const result = await graphqlRequest(
      mutation,
      {
        employeeId,
        startDate,
        endDate,
        adminId,
      },
      true,
    )

    if (result.errors) {
      console.error("[v0] GraphQL errors:", result.errors)
      return NextResponse.json(
        { error: result.errors[0]?.message || "Failed to mark payment as paid" },
        { status: 400 },
      )
    }

    console.log("[v0] Marked", result.data.update_commissions.affected_rows, "commissions as paid")

    return NextResponse.json({
      success: true,
      affectedRows: result.data.update_commissions.affected_rows,
    })
  } catch (error: any) {
    console.error("[v0] Error marking payment as paid:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
