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
  })

  return response.json()
}

const UPDATE_UPI_MUTATION = `
  mutation UpdateEmployeeUpi($id: uuid!, $upiId: String) {
    update_employees_by_pk(
      pk_columns: { id: $id }
      _set: { upi_id: $upiId }
    ) {
      id
      upi_id
    }
  }
`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, upiId } = body

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const result = await graphqlRequest(UPDATE_UPI_MUTATION, { id, upiId })

    if (result.errors) {
      console.error("[v0] GraphQL errors:", result.errors)
      return NextResponse.json({ error: result.errors[0]?.message || "Failed to update UPI ID" }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
