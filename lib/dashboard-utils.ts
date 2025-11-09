// Calculate which period (part) of the month a date belongs to
export function getDatePeriod(date: Date): 1 | 2 | 3 {
  const day = date.getDate()
  if (day <= 10) return 1
  if (day <= 20) return 2
  return 3
}

// Get date range for a specific period
export function getPeriodDateRange(year: number, month: number, period: 1 | 2 | 3) {
  let startDay: number, endDay: number

  if (period === 1) {
    startDay = 1
    endDay = 10
  } else if (period === 2) {
    startDay = 11
    endDay = 20
  } else {
    startDay = 21
    endDay = new Date(year, month + 1, 0).getDate() // Last day of month
  }

  return {
    start: new Date(year, month, startDay),
    end: new Date(year, month, endDay),
  }
}

// Group commission data by period
export function groupDataByPeriod(commissions: any[]) {
  const periods = {
    1: { earnings: 0, orders: 0, cancelled: 0, dailyData: [] as any[] },
    2: { earnings: 0, orders: 0, cancelled: 0, dailyData: [] as any[] },
    3: { earnings: 0, orders: 0, cancelled: 0, dailyData: [] as any[] },
  }

  commissions.forEach((commission) => {
    const slotDate = new Date(commission.slot.slot_date)
    const period = getDatePeriod(slotDate)
    const day = slotDate.getDate()

    // Aggregate period totals
    periods[period].earnings += Number.parseFloat(commission.total_commission || 0)
    periods[period].orders += commission.order_submission?.total_orders || 0
    periods[period].cancelled += commission.cancellation_submission?.total_cancelled || 0

    // Add daily data for charts
    periods[period].dailyData.push({
      day: day,
      date: slotDate.toISOString().split("T")[0],
      earnings: Number.parseFloat(commission.total_commission || 0),
      orders: commission.order_submission?.total_orders || 0,
      cancelled: commission.cancellation_submission?.total_cancelled || 0,
    })
  })

  return periods
}

// Calculate active streak (consecutive days with approved commissions)
export function calculateActiveStreak(commissions: any[]): number {
  if (commissions.length === 0) return 0

  const sortedDates = commissions.map((c) => new Date(c.slot.slot_date).getTime()).sort((a, b) => b - a) // Sort descending (most recent first)

  let streak = 1
  const oneDayMs = 24 * 60 * 60 * 1000

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diff = sortedDates[i] - sortedDates[i + 1]

    // If consecutive days (difference is 1 day)
    if (diff === oneDayMs) {
      streak++
    } else if (diff > oneDayMs) {
      // Gap in dates, break streak
      break
    }
  }

  return streak
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
