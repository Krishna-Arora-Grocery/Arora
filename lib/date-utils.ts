/**
 * Convert UTC timestamp to IST (Indian Standard Time, UTC+5:30)
 * Uses manual offset calculation for reliability
 */
export function formatUTCToIST(utcTimestamp: string | Date): {
  date: string
  time: string
  dateTime: string
  fullDateTime: string
} {
  const dateStr = utcTimestamp instanceof Date ? utcTimestamp.toISOString() : utcTimestamp

  // Parse as UTC date
  const utcDate = new Date(dateStr + (dateStr.includes("Z") || dateStr.includes("+") ? "" : "Z"))

  // Add IST offset manually (5 hours 30 minutes = 330 minutes)
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000)

  // Format the IST date
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const month = months[istDate.getUTCMonth()]
  const day = istDate.getUTCDate()
  const year = istDate.getUTCFullYear()

  let hours = istDate.getUTCHours()
  const minutes = istDate.getUTCMinutes()
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12 || 12

  const date = `${month} ${day}, ${year}`
  const time = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`

  return {
    date,
    time,
    dateTime: `${date}, ${time}`,
    fullDateTime: `${date}, ${time}`,
  }
}

/**
 * Format a date in IST timezone using manual offset
 */
export function formatDateIST(date: Date | string, format: "short" | "long" | "full" = "short"): string {
  const dateStr = date instanceof Date ? date.toISOString() : date
  const utcDate = new Date(dateStr + (dateStr.includes("Z") || dateStr.includes("+") ? "" : "Z"))
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000)

  const months =
    format === "short"
      ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ]

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const month = months[istDate.getUTCMonth()]
  const day = istDate.getUTCDate()
  const year = istDate.getUTCFullYear()

  if (format === "full") {
    const weekday = weekdays[istDate.getUTCDay()]
    return `${weekday}, ${month} ${day}, ${year}`
  }

  return `${month} ${day}, ${year}`
}

/**
 * Get only time in IST using manual offset
 */
export function getTimeIST(date: Date | string): string {
  const dateStr = date instanceof Date ? date.toISOString() : date
  const utcDate = new Date(dateStr + (dateStr.includes("Z") || dateStr.includes("+") ? "" : "Z"))
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000)

  let hours = istDate.getUTCHours()
  const minutes = istDate.getUTCMinutes()
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12 || 12

  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`
}

/**
 * Convert IST datetime input to UTC for database storage
 * Takes a date and time in IST and converts to UTC ISO string
 */
export function convertISTToUTC(istDate: Date, timeString: string): string {
  // Create a new date object for the IST datetime
  const [hours, minutes] = timeString.split(":").map(Number)

  // Create date in local timezone (treating it as IST)
  const year = istDate.getFullYear()
  const month = istDate.getMonth()
  const day = istDate.getDate()

  // Create UTC date by subtracting IST offset (5:30)
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0))
  utcDate.setMinutes(utcDate.getMinutes() - 330) // Subtract 5 hours 30 minutes

  return utcDate.toISOString()
}

/**
 * Convert UTC timestamp to IST Date object
 * Useful for setting date picker values
 */
export function utcToISTDate(utcTimestamp: string | Date): Date {
  const dateStr = utcTimestamp instanceof Date ? utcTimestamp.toISOString() : utcTimestamp
  const utcDate = new Date(dateStr + (dateStr.includes("Z") || dateStr.includes("+") ? "" : "Z"))
  return new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000)
}

/**
 * Get time in HH:mm format from UTC timestamp (converted to IST)
 */
export function getTimeStringIST(utcTimestamp: string | Date): string {
  const istDate = utcToISTDate(utcTimestamp)
  const hours = istDate.getUTCHours().toString().padStart(2, "0")
  const minutes = istDate.getUTCMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

/**
 * Format UTC date for display in IST with custom format
 */
export function formatUTCDateToIST(utcTimestamp: string | Date, formatStr: string): string {
  const istDate = utcToISTDate(utcTimestamp)

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthsFull = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const day = istDate.getUTCDate()
  const month = istDate.getUTCMonth()
  const year = istDate.getUTCFullYear()
  const dayOfWeek = istDate.getUTCDay()
  const hours = istDate.getUTCHours()
  const minutes = istDate.getUTCMinutes()

  // Format time
  const hours12 = hours % 12 || 12
  const ampm = hours >= 12 ? "PM" : "AM"
  const minutesStr = minutes.toString().padStart(2, "0")
  const hoursStr = hours.toString().padStart(2, "0")

  switch (formatStr) {
    case "PPP":
      return `${monthsFull[month]} ${day}, ${year}`
    case "EEEE, d MMM yyyy":
      return `${days[dayOfWeek]}, ${day} ${months[month]} ${year}`
    case "d MMM yyyy, h:mm a":
      return `${day} ${months[month]} ${year}, ${hours12}:${minutesStr} ${ampm}`
    case "HH:mm":
      return `${hoursStr}:${minutesStr}`
    case "d MMM":
      return `${day} ${months[month]}`
    case "d MMM yyyy":
      return `${day} ${months[month]} ${year}`
    default:
      return istDate.toISOString()
  }
}
