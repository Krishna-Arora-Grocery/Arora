// Simple GraphQL client using fetch (no external dependencies)
const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://ufqoblprovsdspfuviqa.hasura.ap-south-1.nhost.run/v1/graphql"

export interface GraphQLResponse<T = any> {
  data?: T
  errors?: Array<{ message: string }>
}

export async function graphqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>,
  useAdminSecret = false,
): Promise<GraphQLResponse<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (useAdminSecret && typeof process !== "undefined" && process.env?.NHOST_ADMIN_SECRET) {
      headers["x-hasura-admin-secret"] = process.env.NHOST_ADMIN_SECRET
      headers["x-hasura-role"] = "admin"
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error("[v0] GraphQL request error:", error)
    return {
      errors: [{ message: "Network error occurred" }],
    }
  }
}

// Query to authenticate user
export const LOGIN_QUERY = `
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

// Query to get employee data
export const GET_EMPLOYEE_QUERY = `
  query GetEmployee($id: uuid!) {
    employees_by_pk(id: $id) {
      id
      name
      email
      username
      role
      telegram_username
      total_ids_given
      upi_id
      instaddr_account_id
      instaddr_account_email
    }
  }
`

// Query to get active slots
export const GET_ACTIVE_SLOTS_QUERY = `
  query GetActiveSlots {
    slots(
      where: { status: { _eq: "active" } }
      order_by: { slot_date: asc }
    ) {
      id
      name
      slot_date
      order_submission_deadline
      cancellation_submission_deadline
      new_id_success_commission
      old_id_success_commission
      new_id_cancelled_commission
      old_id_cancelled_commission
      status
    }
  }
`

export const UPDATE_EMPLOYEE_UPI_MUTATION = `
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

export const UPDATE_EMPLOYEE_PASSWORD_MUTATION = `
  mutation UpdateEmployeePassword($id: uuid!, $passwordHash: String!) {
    update_employees_by_pk(
      pk_columns: { id: $id }
      _set: { password_hash: $passwordHash }
    ) {
      id
    }
  }
`
