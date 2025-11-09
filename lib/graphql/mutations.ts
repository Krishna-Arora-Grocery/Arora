import { gql } from "@apollo/client"

// Employee Mutations
export const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee(
    $name: String!
    $email: String!
    $username: String!
    $passwordHash: String!
    $telegramUsername: String
    $totalIdsGiven: Int
    $instaddrAccountId: String
    $instaddrAccountPassword: String
    $instaddrAccountEmail: String
    $role: String!
  ) {
    insert_employees_one(
      object: {
        name: $name
        email: $email
        username: $username
        password_hash: $passwordHash
        telegram_username: $telegramUsername
        total_ids_given: $totalIdsGiven
        instaddr_account_id: $instaddrAccountId
        instaddr_account_password: $instaddrAccountPassword
        instaddr_account_email: $instaddrAccountEmail
        role: $role
      }
    ) {
      id
      name
      email
      username
      role
    }
  }
`

export const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee(
    $id: uuid!
    $name: String
    $email: String
    $telegramUsername: String
    $totalIdsGiven: Int
    $instaddrAccountId: String
    $instaddrAccountPassword: String
    $instaddrAccountEmail: String
    $upiId: String
    $status: String
    $mobileNumber: String
    $streak: Int
  ) {
    update_employees_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        email: $email
        telegram_username: $telegramUsername
        total_ids_given: $totalIdsGiven
        instaddr_account_id: $instaddrAccountId
        instaddr_account_password: $instaddrAccountPassword
        instaddr_account_email: $instaddrAccountEmail
        upi_id: $upiId
        status: $status
        mobile_number: $mobileNumber
        streak: $streak
        updated_at: "now()"
      }
    ) {
      id
      name
      email
      upi_id
      mobile_number
      status
      streak
    }
  }
`

export const UPDATE_EMPLOYEE_PASSWORD = gql`
  mutation UpdateEmployeePassword($id: uuid!, $passwordHash: String!) {
    update_employees_by_pk(pk_columns: { id: $id }, _set: { password_hash: $passwordHash, updated_at: "now()" }) {
      id
      updated_at
    }
  }
`

export const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($id: uuid!) {
    delete_employees_by_pk(id: $id) {
      id
    }
  }
`

// Slot Mutations
export const CREATE_SLOT = gql`
  mutation CreateSlot(
    $name: String!
    $slotDate: date!
    $orderSubmissionDeadline: timestamp!
    $cancellationSubmissionDeadline: timestamp!
    $newIdSuccessCommission: numeric!
    $oldIdSuccessCommission: numeric!
    $newIdCancelledCommission: numeric!
    $oldIdCancelledCommission: numeric!
    $createdBy: uuid!
  ) {
    insert_slots_one(
      object: {
        name: $name
        slot_date: $slotDate
        order_submission_deadline: $orderSubmissionDeadline
        cancellation_submission_deadline: $cancellationSubmissionDeadline
        new_id_success_commission: $newIdSuccessCommission
        old_id_success_commission: $oldIdSuccessCommission
        new_id_cancelled_commission: $newIdCancelledCommission
        old_id_cancelled_commission: $oldIdCancelledCommission
        created_by: $createdBy
      }
    ) {
      id
      name
      slot_date
    }
  }
`

export const UPDATE_SLOT = gql`
  mutation UpdateSlot(
    $id: uuid!
    $name: String
    $slotDate: date
    $orderSubmissionDeadline: timestamp
    $cancellationSubmissionDeadline: timestamp
    $newIdSuccessCommission: numeric
    $oldIdSuccessCommission: numeric
    $newIdCancelledCommission: numeric
    $oldIdCancelledCommission: numeric
    $status: String
  ) {
    update_slots_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        slot_date: $slotDate
        order_submission_deadline: $orderSubmissionDeadline
        cancellation_submission_deadline: $cancellationSubmissionDeadline
        new_id_success_commission: $newIdSuccessCommission
        old_id_success_commission: $oldIdSuccessCommission
        new_id_cancelled_commission: $newIdCancelledCommission
        old_id_cancelled_commission: $oldIdCancelledCommission
        status: $status
        updated_at: "now()"
      }
    ) {
      id
      name
    }
  }
`

export const DELETE_SLOT = gql`
  mutation DeleteSlot($id: uuid!) {
    delete_slots_by_pk(id: $id) {
      id
    }
  }
`

// Order Submission Mutations
export const CREATE_ORDER_SUBMISSION = gql`
  mutation CreateOrderSubmission(
    $employeeId: uuid!
    $slotId: uuid!
    $totalOrders: Int!
    $totalOldIdOrders: Int!
    $totalNewIdOrders: Int!
    $orderDetails: [order_details_insert_input!]!
  ) {
    insert_order_submissions_one(
      object: {
        employee_id: $employeeId
        slot_id: $slotId
        total_orders: $totalOrders
        total_old_id_orders: $totalOldIdOrders
        total_new_id_orders: $totalNewIdOrders
        order_details: { data: $orderDetails }
      }
    ) {
      id
      total_orders
    }
  }
`

export const APPROVE_ORDER_SUBMISSION = gql`
  mutation ApproveOrderSubmission($id: uuid!, $approvedBy: uuid!) {
    update_order_submissions_by_pk(
      pk_columns: { id: $id }
      _set: {
        approval_status: "approved"
        approved_by: $approvedBy
        approved_at: "now()"
        updated_at: "now()"
      }
    ) {
      id
      approval_status
    }
  }
`

// Cancellation Submission Mutations
export const CREATE_CANCELLATION_SUBMISSION = gql`
  mutation CreateCancellationSubmission(
    $employeeId: uuid!
    $slotId: uuid!
    $orderSubmissionId: uuid!
    $totalCancelled: Int!
    $totalOldIdCancelled: Int!
    $totalNewIdCancelled: Int!
    $cancellationDetails: [cancellation_details_insert_input!]!
  ) {
    insert_cancellation_submissions_one(
      object: {
        employee_id: $employeeId
        slot_id: $slotId
        order_submission_id: $orderSubmissionId
        total_cancelled: $totalCancelled
        total_old_id_cancelled: $totalOldIdCancelled
        total_new_id_cancelled: $totalNewIdCancelled
        cancellation_details: { data: $cancellationDetails }
      }
    ) {
      id
      total_cancelled
    }
  }
`

export const APPROVE_CANCELLATION_SUBMISSION = gql`
  mutation ApproveCancellationSubmission($id: uuid!, $approvedBy: uuid!) {
    update_cancellation_submissions_by_pk(
      pk_columns: { id: $id }
      _set: {
        approval_status: "approved"
        approved_by: $approvedBy
        approved_at: "now()"
        updated_at: "now()"
      }
    ) {
      id
      approval_status
    }
  }
`

// Commission Mutations
export const CREATE_COMMISSION = gql`
  mutation CreateCommission(
    $employeeId: uuid!
    $slotId: uuid!
    $orderSubmissionId: uuid
    $cancellationSubmissionId: uuid
    $oldIdSuccessAmount: numeric!
    $newIdSuccessAmount: numeric!
    $oldIdCancelledAmount: numeric!
    $newIdCancelledAmount: numeric!
    $totalCommission: numeric!
    $date: date!
  ) {
    insert_commissions_one(
      object: {
        employee_id: $employeeId
        slot_id: $slotId
        order_submission_id: $orderSubmissionId
        cancellation_submission_id: $cancellationSubmissionId
        old_id_success_amount: $oldIdSuccessAmount
        new_id_success_amount: $newIdSuccessAmount
        old_id_cancelled_amount: $oldIdCancelledAmount
        new_id_cancelled_amount: $newIdCancelledAmount
        total_commission: $totalCommission
        date: $date
        status: "approved"
        payment_status: "pending"
      }
    ) {
      id
      total_commission
      date
    }
  }
`

// Payment Mutations
export const CREATE_PAYMENT = gql`
  mutation CreatePayment(
    $employeeId: uuid!
    $slotId: uuid!
    $commissionId: uuid!
    $amount: numeric!
  ) {
    insert_payments_one(
      object: {
        employee_id: $employeeId
        slot_id: $slotId
        commission_id: $commissionId
        amount: $amount
        payment_status: "pending"
      }
    ) {
      id
      amount
    }
  }
`

export const UPDATE_PAYMENT_STATUS = gql`
  mutation UpdatePaymentStatus(
    $id: uuid!
    $paymentStatus: String!
    $paymentDate: timestamp
    $paymentMethod: String
    $transactionId: String
  ) {
    update_payments_by_pk(
      pk_columns: { id: $id }
      _set: {
        payment_status: $paymentStatus
        payment_date: $paymentDate
        payment_method: $paymentMethod
        transaction_id: $transactionId
        updated_at: "now()"
      }
    ) {
      id
      payment_status
    }
  }
`
