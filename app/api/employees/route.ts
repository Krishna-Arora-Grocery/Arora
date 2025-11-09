import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === "create") {
      const mutation = `
        mutation CreateEmployee($object: employees_insert_input!) {
          insert_employees_one(object: $object) {
            id
            name
            email
            username
            created_at
          }
        }
      `

      const result = await graphqlRequest(mutation, { object: data }, true)

      if (result.errors) {
        console.error("[v0] GraphQL errors:", result.errors)
        return NextResponse.json({ error: result.errors[0]?.message || "Failed to create employee" }, { status: 400 })
      }

      return NextResponse.json({ data: result.data })
    }

    if (action === "update") {
      const { id, updates } = data
      const mutation = `
        mutation UpdateEmployee($id: uuid!, $updates: employees_set_input!) {
          update_employees_by_pk(pk_columns: { id: $id }, _set: $updates) {
            id
            name
            email
            username
            updated_at
          }
        }
      `

      const result = await graphqlRequest(mutation, { id, updates }, true)

      if (result.errors) {
        return NextResponse.json({ error: result.errors[0]?.message || "Failed to update employee" }, { status: 400 })
      }

      return NextResponse.json({ data: result.data })
    }

    if (action === "delete") {
      const { id } = data
      const mutation = `
        mutation DeleteEmployee($id: uuid!) {
          delete_employees_by_pk(id: $id) {
            id
          }
        }
      `

      const result = await graphqlRequest(mutation, { id }, true)

      if (result.errors) {
        return NextResponse.json({ error: result.errors[0]?.message || "Failed to delete employee" }, { status: 400 })
      }

      return NextResponse.json({ data: result.data })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
