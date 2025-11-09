"use client"

import { useQuery } from "@apollo/client"
import { GET_ACTIVE_SLOTS, GET_SLOTS_BY_DATE_RANGE } from "../graphql/queries"
import { formatDateForGraphQL, getPartDateRange } from "../utils/date-helpers"

export function useActiveSlots() {
  const { data, loading, error, refetch } = useQuery(GET_ACTIVE_SLOTS)

  return {
    slots: data?.slots || [],
    loading,
    error,
    refetch,
  }
}

export function useSlotsByPeriod(date: Date, part: 1 | 2 | 3) {
  const { start, end } = getPartDateRange(date, part)

  const { data, loading, error, refetch } = useQuery(GET_SLOTS_BY_DATE_RANGE, {
    variables: {
      startDate: formatDateForGraphQL(start),
      endDate: formatDateForGraphQL(end),
    },
  })

  return {
    slots: data?.slots || [],
    loading,
    error,
    refetch,
  }
}
