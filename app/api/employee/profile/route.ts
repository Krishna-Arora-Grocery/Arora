import { type NextRequest, NextResponse } from "next/server"

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://ufqoblprovsdspfuviqa.hasura.ap-south-1.nhost.run/v1/graphql"

async function graphqlRequest(query: string, variables?: Record<string, any>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (process.env.NHOST_ADMIN_SECRET) {
    headers["x-hasura-admin-secret"] = process.env.NHOST_ADMIN_SECRET
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  })

  return response.json()
}

const GET_EMPLOYEE_QUERY = `
  query GetEmployeeById($id: uuid!) {
    employees_by_pk(id: $id) {
      id
      name
      email
      username
      telegram_username
      total_ids_given
      instaddr_account_id
      instaddr_account_email
      instaddr_account_password
      upi_id
      mobile_number
      excel_link
    }
  }
`

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const result = await graphqlRequest(GET_EMPLOYEE_QUERY, { id })

    if (result.errors) {
      console.error("[v0] GraphQL errors:", result.errors)
      return NextResponse.json({ error: result.errors[0]?.message || "Failed to fetch employee" }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
