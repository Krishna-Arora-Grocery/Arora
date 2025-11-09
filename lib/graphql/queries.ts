import { gql } from "@apollo/client"

// Employee Queries
export const GET_EMPLOYEE_BY_USER_ID = gql`
  query GetEmployeeByUserId($userId: uuid!) {
    employees(where: { user_id: { _eq: $userId } }) {
      id
      user_id
      name
      email
      username
      telegram_username
      total_ids_given
      instaddr_account_id
      instaddr_account_email
      instaddr_account_password
      upi_id
      role
      status
      streak
      created_at
      updated_at
      mobile_number
    }
  }
`

export const GET_ALL_EMPLOYEES = gql`
  query GetAllEmployees {
    employees(order_by: { created_at: desc }) {
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
      role
      status
      streak
      created_at
      updated_at
      mobile_number
    }
  }
`

export const GET_EMPLOYEE_BY_ID = gql`
  query GetEmployeeById($id: uuid!) {
    employees_by_pk(id: $id) {
      id
      user_id
      name
      email
      username
      telegram_username
      total_ids_given
      instaddr_account_id
      instaddr_account_email
      instaddr_account_password
      upi_id
      role
      status
      streak
      created_at
      updated_at
      mobile_number
    }
  }
`

// Slots Queries
export const GET_ACTIVE_SLOTS = gql`
  query GetActiveSlots {
    slots(
      where: { status: { _in: ["active", "upcoming"] } }
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
      created_at
    }
  }
`

export const GET_SLOTS_BY_DATE_RANGE = gql`
  query GetSlotsByDateRange($startDate: date!, $endDate: date!) {
    slots(
      where: { slot_date: { _gte: $startDate, _lte: $endDate } }
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
      created_at
    }
  }
`

// Order Submissions Queries
export const GET_EMPLOYEE_ORDER_SUBMISSIONS = gql`
  query GetEmployeeOrderSubmissions($employeeId: uuid!) {
    order_submissions(
      where: { employee_id: { _eq: $employeeId } }
      order_by: { submitted_at: desc }
    ) {
      id
      slot_id
      total_orders
      total_old_id_orders
      total_new_id_orders
      approval_status
      submitted_at
      slot {
        id
        name
        slot_date
      }
      order_details {
        id
        pincode
        id_type
        order_count
      }
    }
  }
`

export const GET_PENDING_ORDER_SUBMISSIONS = gql`
  query GetPendingOrderSubmissions {
    order_submissions(
      where: { approval_status: { _eq: "pending" } }
      order_by: { submitted_at: desc }
    ) {
      id
      employee_id
      slot_id
      total_orders
      total_old_id_orders
      total_new_id_orders
      approval_status
      submitted_at
      employee {
        id
        name
        email
      }
      slot {
        id
        name
        slot_date
      }
      order_details {
        id
        pincode
        id_type
        order_count
      }
    }
  }
`

// Cancellation Submissions Queries
export const GET_EMPLOYEE_CANCELLATION_SUBMISSIONS = gql`
  query GetEmployeeCancellationSubmissions($employeeId: uuid!) {
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
      slot {
        id
        name
        slot_date
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

export const GET_PENDING_CANCELLATION_SUBMISSIONS = gql`
  query GetPendingCancellationSubmissions {
    cancellation_submissions(
      where: { approval_status: { _eq: "pending" } }
      order_by: { submitted_at: desc }
    ) {
      id
      employee_id
      slot_id
      order_submission_id
      total_cancelled
      total_old_id_cancelled
      total_new_id_cancelled
      approval_status
      submitted_at
      employee {
        id
        name
        email
      }
      slot {
        id
        name
        slot_date
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

// Commissions Queries
export const GET_EMPLOYEE_COMMISSIONS = gql`
  query GetEmployeeCommissions($employeeId: uuid!) {
    commissions(
      where: { employee_id: { _eq: $employeeId } }
      order_by: { calculated_at: desc }
    ) {
      id
      slot_id
      old_id_success_amount
      new_id_success_amount
      old_id_cancelled_amount
      new_id_cancelled_amount
      total_commission
      status
      date
      calculated_at
      slot {
        id
        name
        slot_date
      }
    }
  }
`

// Payments Queries
export const GET_EMPLOYEE_PAYMENTS = gql`
  query GetEmployeePayments($employeeId: uuid!) {
    payments(
      where: { employee_id: { _eq: $employeeId } }
      order_by: { created_at: desc }
    ) {
      id
      slot_id
      amount
      payment_status
      payment_date
      payment_method
      transaction_id
      slot {
        id
        name
        slot_date
      }
    }
  }
`

export const GET_ALL_PAYMENTS = gql`
  query GetAllPayments {
    payments(order_by: { created_at: desc }) {
      id
      employee_id
      slot_id
      amount
      payment_status
      payment_date
      payment_method
      transaction_id
      employee {
        id
        name
        email
      }
      slot {
        id
        name
        slot_date
      }
    }
  }
`

// Daily Summaries Query
export const GET_DAILY_SUMMARIES = gql`
  query GetDailySummaries($startDate: date!, $endDate: date!) {
    daily_summaries(
      where: { date: { _gte: $startDate, _lte: $endDate } }
      order_by: { date: asc }
    ) {
      id
      date
      total_employees
      total_orders
      total_cancelled
      total_commission
      total_paid
      total_pending
    }
  }
`

// Dashboard Statistics Queries
export const GET_EMPLOYEE_DASHBOARD_STATS = gql`
  query GetEmployeeDashboardStats($employeeId: uuid!, $currentMonth: date!, $monthEnd: date!) {
    # Total lifetime earnings
    lifetime_earnings: commissions_aggregate(
      where: { employee_id: { _eq: $employeeId }, status: { _eq: "approved" } }
    ) {
      aggregate {
        sum {
          total_commission
        }
      }
    }

    # Total lifetime orders
    lifetime_orders: order_submissions_aggregate(
      where: { employee_id: { _eq: $employeeId }, approval_status: { _eq: "approved" } }
    ) {
      aggregate {
        sum {
          total_orders
        }
      }
    }

    # This month earnings
    month_earnings: commissions_aggregate(
      where: {
        employee_id: { _eq: $employeeId }
        status: { _eq: "approved" }
        date: { _gte: $currentMonth, _lte: $monthEnd }
      }
    ) {
      aggregate {
        sum {
          total_commission
        }
      }
    }

    # Monthly data with slot details
    monthly_commissions: commissions(
      where: {
        employee_id: { _eq: $employeeId }
        status: { _eq: "approved" }
        date: { _gte: $currentMonth, _lte: $monthEnd }
      }
      order_by: { date: asc }
    ) {
      id
      total_commission
      old_id_success_amount
      new_id_success_amount
      old_id_cancelled_amount
      new_id_cancelled_amount
      date
      slot {
        slot_date
      }
      order_submission {
        total_orders
        total_old_id_orders
        total_new_id_orders
      }
      cancellation_submission {
        total_cancelled
        total_old_id_cancelled
        total_new_id_cancelled
      }
    }
  }
`

export const GET_EMPLOYEE_MONTHLY_DETAILS = gql`
  query GetEmployeeMonthlyDetails(
    $employeeId: uuid!
    $startDate: date!
    $endDate: date!
  ) {
    commissions(
      where: {
        employee_id: { _eq: $employeeId }
        status: { _eq: "approved" }
        date: { _gte: $startDate, _lte: $endDate }
      }
      order_by: { date: asc }
    ) {
      id
      total_commission
      old_id_success_amount
      new_id_success_amount
      old_id_cancelled_amount
      new_id_cancelled_amount
      date
      calculated_at
      slot {
        id
        slot_date
        name
      }
      order_submission {
        id
        total_orders
        total_old_id_orders
        total_new_id_orders
      }
      cancellation_submission {
        id
        total_cancelled
        total_old_id_cancelled
        total_new_id_cancelled
      }
    }
  }
`
