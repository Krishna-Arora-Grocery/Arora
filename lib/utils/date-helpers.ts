import { format, endOfMonth } from "date-fns"

export function getMonthParts(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()

  return {
    part1: {
      start: new Date(year, month, 1),
      end: new Date(year, month, 10),
    },
    part2: {
      start: new Date(year, month, 11),
      end: new Date(year, month, 20),
    },
    part3: {
      start: new Date(year, month, 21),
      end: endOfMonth(date),
    },
  }
}

export function getPartDateRange(date: Date, part: 1 | 2 | 3) {
  const parts = getMonthParts(date)
  return parts[`part${part}` as keyof typeof parts]
}

export function formatDateForGraphQL(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function formatTimestampForGraphQL(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss")
}

export function isSlotExpired(deadline: string): boolean {
  return new Date(deadline) < new Date()
}

export function canSubmitOrders(orderDeadline: string): boolean {
  return new Date(orderDeadline) > new Date()
}

export function canSubmitCancellations(cancellationDeadline: string): boolean {
  return new Date(cancellationDeadline) > new Date()
}
