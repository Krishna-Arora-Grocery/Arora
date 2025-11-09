import { type NextRequest, NextResponse } from "next/server"

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!

export async function GET(request: NextRequest) {
  try {
    const query = `
      query GetAllEmployees {
        employees(
          where: { role: { _neq: "admin" } }
          order_by: { created_at: desc }
        ) {
          id
          name
          email
          username
          mobile_number
          telegram_username
          total_ids_given
          instaddr_account_id
          instaddr_account_email
          instaddr_account_password
          upi_id
          excel_link
          role
          status
          created_at
        }
      }
    `

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": ADMIN_SECRET,
        "x-hasura-role": "admin",
      },
      body: JSON.stringify({ query }),
    })

    const result = await response.json()

    if (result.errors) {
      console.error("[v0] Employees fetch error:", result.errors)
      return NextResponse.json({ error: result.errors[0]?.message || "Failed to fetch employees" }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  } catch (error: any) {
    console.error("[v0] Employees fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch employees" }, { status: 500 })
  }
}
