import { type NextRequest, NextResponse } from "next/server"

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!

async function graphqlRequest(query: string, variables?: any) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
      "x-hasura-role": "admin",
    },
    body: JSON.stringify({ query, variables }),
  })

  const result = await response.json()

  if (result.errors) {
    console.error("GraphQL errors:", result.errors)
  }

  return result
}

export async function GET() {
  try {
    const now = Date.now()
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

    console.log("Current server time:", now, "ISO:", new Date(now).toISOString())

    const query = `
      query GetAllSlots {
        slots(order_by: { slot_date: desc }) {
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
          created_at
          order_submissions_aggregate {
            aggregate {
              sum {
                total_orders
              }
            }
          }
        }
      }
    `

    const result = await graphqlRequest(query)

    if (result.errors) {
      return NextResponse.json({ error: result.errors[0]?.message || "Failed to fetch slots" }, { status: 400 })
    }

    const slotsWithStatus = result.data.slots.map((slot: any) => {
      const cancellationDeadlineUTC = new Date(slot.cancellation_submission_deadline).getTime()
      const orderDeadlineUTC = new Date(slot.order_submission_deadline).getTime()

      const cancellationDeadlineIST = cancellationDeadlineUTC + IST_OFFSET_MS
      const orderDeadlineIST = orderDeadlineUTC + IST_OFFSET_MS

      let computedStatus = "active"
      if (now > cancellationDeadlineIST) {
        computedStatus = "past"
      } else if (now > orderDeadlineIST) {
        computedStatus = "expired"
      }

      const totalOrdersSubmitted = slot.order_submissions_aggregate?.aggregate?.sum?.total_orders || 0

      return {
        ...slot,
        computedStatus,
        totalOrdersSubmitted,
      }
    })

    return NextResponse.json({ data: { slots: slotsWithStatus }, serverTime: new Date(now).toISOString() })
  } catch (error: any) {
    console.error("Slots fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch slots" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    console.log("Slot operation:", action)
    console.log("Request data:", JSON.stringify(data, null, 2))

    if (action === "create") {
      const checkDuplicateQuery = `
        query CheckDuplicateSlot($name: String!, $slot_date: date!) {
          slots(where: { name: { _eq: $name }, slot_date: { _eq: $slot_date } }) {
            id
            name
          }
        }
      `

      const duplicateCheck = await graphqlRequest(checkDuplicateQuery, {
        name: data.name,
        slot_date: data.slot_date,
      })

      if (duplicateCheck.data?.slots && duplicateCheck.data.slots.length > 0) {
        return NextResponse.json(
          {
            error:
              "A slot with this name and date already exists. Please use a different name or edit the existing slot.",
          },
          { status: 400 },
        )
      }

      const mutation = `
        mutation CreateSlot($data: slots_insert_input!) {
          insert_slots_one(object: $data) {
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

      const result = await graphqlRequest(mutation, { data })

      if (result.errors) {
        return NextResponse.json({ error: result.errors[0]?.message || "Failed to create slot" }, { status: 400 })
      }

      console.log("Slot created successfully:", result.data.insert_slots_one)
      return NextResponse.json({ data: result.data })
    } else if (action === "update") {
      const { id, updates } = data

      if (updates.name || updates.slot_date) {
        const checkDuplicateQuery = `
          query CheckDuplicateSlot($name: String!, $slot_date: date!, $excluding_id: uuid!) {
            slots(where: { 
              name: { _eq: $name }, 
              slot_date: { _eq: $slot_date },
              id: { _neq: $excluding_id }
            }) {
              id
              name
            }
          }
        `

        const duplicateCheck = await graphqlRequest(checkDuplicateQuery, {
          name: updates.name,
          slot_date: updates.slot_date,
          excluding_id: id,
        })

        if (duplicateCheck.data?.slots && duplicateCheck.data.slots.length > 0) {
          return NextResponse.json(
            {
              error: "A slot with this name and date already exists. Please use a different name.",
            },
            { status: 400 },
          )
        }
      }

      const mutation = `
        mutation UpdateSlot($id: uuid!, $updates: slots_set_input!) {
          update_slots_by_pk(pk_columns: { id: $id }, _set: $updates) {
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

      const result = await graphqlRequest(mutation, { id, updates })

      if (result.errors) {
        return NextResponse.json({ error: result.errors[0]?.message || "Failed to update slot" }, { status: 400 })
      }

      console.log("Slot updated successfully:", result.data.update_slots_by_pk)
      return NextResponse.json({ data: result.data })
    } else if (action === "delete") {
      const { id } = data

      const mutation = `
        mutation DeleteSlot($id: uuid!) {
          delete_slots_by_pk(id: $id) {
            id
            name
          }
        }
      `

      const result = await graphqlRequest(mutation, { id })

      if (result.errors) {
        return NextResponse.json({ error: result.errors[0]?.message || "Failed to delete slot" }, { status: 400 })
      }

      console.log("Slot deleted successfully:", result.data.delete_slots_by_pk)
      return NextResponse.json({ data: result.data })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Slot operation error:", error)
    return NextResponse.json({ error: error.message || "Failed to process slot operation" }, { status: 500 })
  }
}
