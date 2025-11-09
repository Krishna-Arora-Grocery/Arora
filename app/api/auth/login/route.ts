import { type NextRequest, NextResponse } from "next/server"

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!

const LOGIN_QUERY = `
  query LoginUser($username: String!, $password: String!) {
    employees(
      where: {
        _or: [
          { username: { _eq: $username } },
          { email: { _eq: $username } }
        ],
        password_hash: { _eq: $password },
        status: { _eq: "active" }
      }
    ) {
      id
      name
      email
      username
      role
      telegram_username
      total_ids_given
      upi_id
    }
  }
`

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const encodedPassword = btoa(password)

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: LOGIN_QUERY,
        variables: { username, password: encodedPassword },
      }),
    })

    const result = await response.json()

    if (result.errors) {
      return NextResponse.json({ error: result.errors[0].message }, { status: 400 })
    }

    if (!result.data?.employees || result.data.employees.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    return NextResponse.json({ user: result.data.employees[0] })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 })
  }
}
