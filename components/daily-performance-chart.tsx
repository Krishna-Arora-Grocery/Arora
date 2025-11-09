"use client"

import { useState, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChevronLeft, ChevronRight, LineChartIcon } from "lucide-react"

interface DailyPerformanceChartProps {
  data: any
}

interface TooltipData {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
    name: string
  }>
  label?: string
}

export default function DailyPerformanceChart({ data }: DailyPerformanceChartProps) {
  const [currentPeriod, setCurrentPeriod] = useState<"period1" | "period2" | "period3">("period1")
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const getMonthInfo = () => {
    const monthStr = data.current_month || "November 2025"
    const [monthName, year] = monthStr.split(" ")
    const monthShort = monthName.slice(0, 3) // e.g., "Nov", "May", "Dec"
    return { monthName, monthShort, year }
  }

  const { monthName, monthShort, year } = getMonthInfo()

  const periodLabels = {
    period1: `Days 1-10 (${monthShort} 1-10)`,
    period2: `Days 11-20 (${monthShort} 11-20)`,
    period3: `Days 21-30 (${monthShort} 21-30)`,
  }

  const currentPeriodData = data.periods[currentPeriod]
  const chartData = useMemo(() => {
    const dailyData = currentPeriodData.dailyData || []
    return dailyData.map((item: any) => {
      const date = new Date(item.date)
      return {
        date: item.date,
        earnings: item.earnings,
        dayName: date.getDate().toString(),
        fullDayName: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      }
    })
  }, [currentPeriodData])

  const CustomTooltip = (props: TooltipData) => {
    if (!props.active || !props.payload) return null

    const dataPoint = chartData.find((d: any) => d.dayName === props.label)

    if (!dataPoint) return null

    const dateObj = new Date(dataPoint.date)
    const dateStr = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })

    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg border border-gray-700 text-sm">
        <p className="font-semibold mb-2">
          {monthShort} {props.label}
        </p>
        <p className="text-purple-300">Earnings: ₹{dataPoint.earnings}</p>
      </div>
    )
  }

  const canGoPrev = currentPeriod !== "period1" || chartData.length > 0
  const canGoNext = currentPeriod !== "period3" || chartData.length > 0

  const handlePrevious = () => {
    if (currentPeriod === "period2") setCurrentPeriod("period1")
    else if (currentPeriod === "period3") setCurrentPeriod("period2")
  }

  const handleNext = () => {
    if (currentPeriod === "period1") setCurrentPeriod("period2")
    else if (currentPeriod === "period2") setCurrentPeriod("period3")
  }

  const isPeriodEmpty = chartData.length === 0

  return (
    <div
      className="bg-white rounded-2xl p-4 md:p-7 shadow-sm hover:shadow-lg transition-all duration-300"
      style={{
        animation: `slideInUp 0.6s ease-out`,
        animationDelay: "500ms",
        animationFillMode: "both",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-gray-900">Daily Earning Analysis</h3>
          <p className="text-xs md:text-sm text-gray-600 mt-1">10-Day View</p>
        </div>
        <LineChartIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
      </div>

      <div className="mb-4 md:mb-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentPeriod === "period1"}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPeriod === "period1"
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Prev Period
        </button>

        <div className="text-center">
          <p className="text-xs md:text-sm font-bold text-gray-900">{periodLabels[currentPeriod]}</p>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1">
            {chartData.length > 0
              ? `${chartData[0]?.fullDayName} - ${chartData[chartData.length - 1]?.fullDayName}`
              : "No data"}
          </p>
        </div>

        <button
          onClick={handleNext}
          disabled={currentPeriod === "period3"}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPeriod === "period3"
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Next Period
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Chart */}
      <div className="border-t border-gray-100 pt-4 md:pt-6">
        {isPeriodEmpty ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p className="text-sm">No data available for this period</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                style={{
                  animation: `slideInUp 0.3s ease-out`,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="dayName" tick={{ fill: "#6B7280", fontSize: 12 }} interval={0} angle={0} />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  width={50}
                  label={{
                    value: "Amount (₹)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#6B7280", fontSize: 12 },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="earnings"
                  fill="url(#earningsGradient)"
                  radius={[8, 8, 0, 0]}
                  name="Earnings (₹)"
                  animationDuration={300}
                  maxBarSize={50}
                />
                <defs>
                  <linearGradient id="earningsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#C084FC" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-b from-purple-600 to-purple-300" />
                <span className="text-xs md:text-sm text-gray-700">Earnings (₹)</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
