"use client"

import { useQuery } from "@apollo/client"
import {
  GET_ALL_EMPLOYEES,
  GET_PENDING_ORDER_SUBMISSIONS,
  GET_PENDING_CANCELLATION_SUBMISSIONS,
  GET_ALL_PAYMENTS,
  GET_DAILY_SUMMARIES,
} from "../graphql/queries"
import { formatDateForGraphQL, getPartDateRange } from "../utils/date-helpers"

export function useAllEmployees() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_EMPLOYEES)

  return {
    employees: data?.employees || [],
    loading,
    error,
    refetch,
  }
}

export function usePendingApprovals() {
  const { data: orderData, loading: orderLoading, refetch: refetchOrders } = useQuery(GET_PENDING_ORDER_SUBMISSIONS)

  const {
    data: cancellationData,
    loading: cancellationLoading,
    refetch: refetchCancellations,
  } = useQuery(GET_PENDING_CANCELLATION_SUBMISSIONS)

  return {
    orderSubmissions: orderData?.order_submissions || [],
    cancellationSubmissions: cancellationData?.cancellation_submissions || [],
    loading: orderLoading || cancellationLoading,
    refetch: () => {
      refetchOrders()
      refetchCancellations()
    },
  }
}

export function useAllPayments() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_PAYMENTS)

  return {
    payments: data?.payments || [],
    loading,
    error,
    refetch,
  }
}

export function useDailySummaries(date: Date, part: 1 | 2 | 3) {
  const { start, end } = getPartDateRange(date, part)

  const { data, loading, error, refetch } = useQuery(GET_DAILY_SUMMARIES, {
    variables: {
      startDate: formatDateForGraphQL(start),
      endDate: formatDateForGraphQL(end),
    },
  })

  return {
    summaries: data?.daily_summaries || [],
    loading,
    error,
    refetch,
  }
}
