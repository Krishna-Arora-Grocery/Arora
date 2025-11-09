import { type NextRequest, NextResponse } from "next/server"
import { graphqlRequest } from "@/lib/graphql-client"

// Create or update cancellation submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, slotId, orderSubmissionId, cancellationDetails, cancellationSubmissionId } = body

    const nonZeroCancellations = cancellationDetails.filter((d: any) => d.cancelledCount > 0)

    // Calculate totals from all entries (including zeros for the submission record)
    const totalCancelled = cancellationDetails.reduce((sum: number, d: any) => sum + d.cancelledCount, 0)
    const totalOldIdCancelled = cancellationDetails
      .filter((d: any) => d.idType === "old")
      .reduce((sum: number, d: any) => sum + d.cancelledCount, 0)
    const totalNewIdCancelled = cancellationDetails
      .filter((d: any) => d.idType === "new")
      .reduce((sum: number, d: any) => sum + d.cancelledCount, 0)

    let submissionId = cancellationSubmissionId

    if (!submissionId) {
      const checkQuery = `
        query CheckExistingCancellation($employeeId: uuid!, $slotId: uuid!) {
          cancellation_submissions(
            where: {
              employee_id: { _eq: $employeeId }
              slot_id: { _eq: $slotId }
            }
          ) {
            id
            approval_status
          }
        }
      `

      const checkResult = await graphqlRequest(checkQuery, { employeeId, slotId }, true)

      if (checkResult.data?.cancellation_submissions?.length > 0) {
        const existing = checkResult.data.cancellation_submissions[0]
        submissionId = existing.id
      }
    }

    if (submissionId) {
      const updateMutation = `
        mutation UpdateCancellationSubmission($id: uuid!, $set: cancellation_submissions_set_input!) {
          update_cancellation_submissions_by_pk(pk_columns: { id: $id }, _set: $set) {
            id
            employee_id
            slot_id
            order_submission_id
            total_cancelled
            total_old_id_cancelled
            total_new_id_cancelled
            approval_status
            submitted_at
          }
        }
      `

      const updateVariables = {
        id: submissionId,
        set: {
          total_cancelled: totalCancelled,
          total_old_id_cancelled: totalOldIdCancelled,
          total_new_id_cancelled: totalNewIdCancelled,
          approval_status: "pending",
          submitted_at: new Date().toISOString(),
        },
      }

      const updateResult = await graphqlRequest(updateMutation, updateVariables, true)

      if (updateResult.errors) {
        console.error("GraphQL errors updating cancellation:", updateResult.errors)
        return NextResponse.json(
          { error: updateResult.errors[0]?.message || "Failed to update cancellation submission" },
          { status: 400 },
        )
      }

      const deleteMutation = `
        mutation DeleteOldCancellationDetails($submissionId: uuid!) {
          delete_cancellation_details(where: { cancellation_submission_id: { _eq: $submissionId } }) {
            affected_rows
          }
        }
      `

      await graphqlRequest(deleteMutation, { submissionId }, true)
    } else {
      const mutation = `
        mutation CreateCancellationSubmission($object: cancellation_submissions_insert_input!) {
          insert_cancellation_submissions_one(object: $object) {
            id
            employee_id
            slot_id
            order_submission_id
            total_cancelled
            total_old_id_cancelled
            total_new_id_cancelled
            approval_status
            submitted_at
          }
        }
      `

      const variables = {
        object: {
          employee_id: employeeId,
          slot_id: slotId,
          order_submission_id: orderSubmissionId,
          total_cancelled: totalCancelled,
          total_old_id_cancelled: totalOldIdCancelled,
          total_new_id_cancelled: totalNewIdCancelled,
          approval_status: "pending",
          submitted_at: new Date().toISOString(),
        },
      }

      const result = await graphqlRequest(mutation, variables, true)

      if (result.errors) {
        console.error("GraphQL errors creating cancellation:", result.errors)
        return NextResponse.json(
          { error: result.errors[0]?.message || "Failed to create cancellation submission" },
          { status: 400 },
        )
      }

      submissionId = result.data.insert_cancellation_submissions_one.id
    }

    if (nonZeroCancellations.length > 0) {
      const detailsMutation = `
        mutation CreateCancellationDetails($objects: [cancellation_details_insert_input!]!) {
          insert_cancellation_details(objects: $objects) {
            affected_rows
          }
        }
      `

      const detailsObjects = nonZeroCancellations.map((detail: any) => ({
        cancellation_submission_id: submissionId,
        order_detail_id: detail.orderDetailId,
        pincode: detail.pincode,
        id_type: detail.idType,
        cancelled_count: detail.cancelledCount,
      }))

      const detailsResult = await graphqlRequest(detailsMutation, { objects: detailsObjects }, true)

      if (detailsResult.errors) {
        console.error("Error creating cancellation details:", detailsResult.errors)
      }
    }

    return NextResponse.json({
      success: true,
      submissionId,
    })
  } catch (error: any) {
    console.error("Error processing cancellation submission:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// Get cancellation submissions for an employee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const query = `
      query GetCancellationSubmissions($employeeId: uuid!) {
        cancellation_submissions(
          where: { employee_id: { _eq: $employeeId } }
          order_by: { submitted_at: desc }
        ) {
          id
          slot_id
          order_submission_id
          total_cancelled
          total_old_id_cancelled
          total_new_id_cancelled
          approval_status
          submitted_at
          approved_at
          slot {
            id
            slot_name
            slot_date
          }
          order_submission {
            id
            total_orders
          }
          cancellation_details {
            id
            pincode
            id_type
            cancelled_count
          }
        }
      }
    `

    const result = await graphqlRequest(query, { employeeId }, true)

    if (result.errors) {
      console.error("GraphQL errors fetching cancellations:", result.errors)
      return NextResponse.json(
        { error: result.errors[0]?.message || "Failed to fetch cancellation submissions" },
        { status: 400 },
      )
    }

    return NextResponse.json({ data: result.data.cancellation_submissions })
  } catch (error: any) {
    console.error("Error fetching cancellation submissions:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
