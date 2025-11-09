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

  const result = await response.json()
  return result
}

const GET_EMPLOYEE_PASSWORD = `
  query GetEmployeePassword($id: uuid!) {
    employees_by_pk(id: $id) {
      id
      password_hash
    }
  }
`

const UPDATE_PASSWORD_MUTATION = `
  mutation UpdateEmployeePassword($id: uuid!, $passwordHash: String!) {
    update_employees_by_pk(
      pk_columns: { id: $id }
      _set: { password_hash: $passwordHash }
    ) {
      id
      password_hash
    }
  }
`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, currentPassword, newPassword } = body

    if (!id || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Employee ID, current password, and new password are required" },
        { status: 400 },
      )
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 })
    }

    const employeeResult = await graphqlRequest(GET_EMPLOYEE_PASSWORD, { id })

    if (employeeResult.errors) {
      console.error("[SERVER] GraphQL error:", employeeResult.errors)
      return NextResponse.json({ error: "Failed to verify current password" }, { status: 500 })
    }

    const employee = employeeResult.data?.employees_by_pk

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const storedHash = employee.password_hash

    if (!storedHash) {
      return NextResponse.json({ error: "No password set for this account" }, { status: 400 })
    }

    const currentPasswordHash = btoa(currentPassword)

    if (currentPasswordHash !== storedHash) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    const newPasswordHash = btoa(newPassword)

    const updateResult = await graphqlRequest(UPDATE_PASSWORD_MUTATION, {
      id,
      passwordHash: newPasswordHash,
    })

    if (updateResult?.errors) {
      console.error("[SERVER] GraphQL error:", updateResult.errors)
      return NextResponse.json({ error: "Failed to update password in database" }, { status: 500 })
    }

    if (!updateResult.data?.update_employees_by_pk) {
      return NextResponse.json({ error: "Password update failed - no data returned" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (err) {
    console.error("[SERVER] API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
