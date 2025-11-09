"use client"

import { useQuery } from "@apollo/client"
import {
  GET_EMPLOYEE_ORDER_SUBMISSIONS,
  GET_EMPLOYEE_CANCELLATION_SUBMISSIONS,
  GET_EMPLOYEE_COMMISSIONS,
  GET_EMPLOYEE_PAYMENTS,
} from "../graphql/queries"
import { useAuth } from "../auth-context"

export function useEmployeeOrderSubmissions() {
  const { employee } = useAuth()

  const { data, loading, error, refetch } = useQuery(GET_EMPLOYEE_ORDER_SUBMISSIONS, {
    variables: { employeeId: employee?.id },
    skip: !employee?.id,
  })

  return {
    submissions: data?.order_submissions || [],
    loading,
    error,
    refetch,
  }
}

export function useEmployeeCancellationSubmissions() {
  const { employee } = useAuth()

  const { data, loading, error, refetch } = useQuery(GET_EMPLOYEE_CANCELLATION_SUBMISSIONS, {
    variables: { employeeId: employee?.id },
    skip: !employee?.id,
  })

  return {
    submissions: data?.cancellation_submissions || [],
    loading,
    error,
    refetch,
  }
}

export function useEmployeeCommissions() {
  const { employee } = useAuth()

  const { data, loading, error, refetch } = useQuery(GET_EMPLOYEE_COMMISSIONS, {
    variables: { employeeId: employee?.id },
    skip: !employee?.id,
  })

  return {
    commissions: data?.commissions || [],
    loading,
    error,
    refetch,
  }
}

export function useEmployeePayments() {
  const { employee } = useAuth()

  const { data, loading, error, refetch } = useQuery(GET_EMPLOYEE_PAYMENTS, {
    variables: { employeeId: employee?.id },
    skip: !employee?.id,
  })

  return {
    payments: data?.payments || [],
    loading,
    error,
    refetch,
  }
}
