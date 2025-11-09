"use client"

import { useState, useEffect, useMemo } from "react"
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChevronDown, Calendar, TrendingUp, CheckCircle2, AlertCircle, Zap } from "lucide-react"

interface MonthlyChartsSectionProps {
  data: any
}

export default function MonthlyChartsSection({ data }: MonthlyChartsSectionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"period1" | "period2" | "period3">("period1")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [animateValues, setAnimateValues] = useState(false)

  const getMonthInfo = () => {
    const monthStr = data.current_month || "November 2025"
    const [monthName, year] = monthStr.split(" ")
    const monthShort = monthName.slice(0, 3) // e.g., "Nov", "May", "Dec"
    return { monthName, monthShort, year }
  }

  const { monthName, monthShort, year } = getMonthInfo()

  const periodLabels = {
    period1: `1st 10 Days (1-10 ${monthShort})`,
    period2: `2nd 10 Days (11-20 ${monthShort})`,
    period3: `3rd 10 Days (21-30 ${monthShort})`,
  }

  const currentPeriodData = data.periods[selectedPeriod]

  const currentChartData = useMemo(() => {
    const dailyData = currentPeriodData.dailyData || []
    return dailyData.map((item: any) => {
      const date = new Date(item.date)
      const day = date.getDate()
      return {
        day: `${monthShort} ${day}`,
        placed: item.orders - item.cancelled, // Actual placed orders (total - cancelled)
        cancelled: item.cancelled, // Actual cancelled orders
      }
    })
  }, [currentPeriodData, monthShort])

  useEffect(() => {
    setAnimateValues(false)
    const timer = setTimeout(() => setAnimateValues(true), 50)
    return () => clearTimeout(timer)
  }, [selectedPeriod])

  const totalOrders = currentPeriodData.placed + currentPeriodData.cancelled
  const placedPercentage = totalOrders > 0 ? (currentPeriodData.placed / totalOrders) * 100 : 0
  const cancelledPercentage = totalOrders > 0 ? (currentPeriodData.cancelled / totalOrders) * 100 : 0

  const AnimatedCounter = ({ from, to, duration }: { from: number; to: number; duration: number }) => {
    const [count, setCount] = useState(from)

    useEffect(() => {
      if (!animateValues) return

      let startTime: number | null = null
      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        const springProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

        setCount(Math.floor(from + (to - from) * springProgress))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }, [animateValues, to, from])

    return <span>{count}</span>
  }

  const AnimatedCurrencyCounter = ({ from, to, duration }: { from: number; to: number; duration: number }) => {
    const [count, setCount] = useState(from)

    useEffect(() => {
      if (!animateValues) return

      let startTime: number | null = null
      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        const springProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

        setCount(Math.floor(from + (to - from) * springProgress))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }, [animateValues, to, from])

    return <span>₹{count.toLocaleString()}</span>
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.day}</p>
          <p className="text-sm text-green-600 font-medium">Placed: {payload[0].payload.placed}</p>
          <p className="text-sm text-red-600 font-medium">Cancelled: {payload[0].payload.cancelled}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div
        className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
        style={{
          animationName: "slideInUp",
          animationDuration: "0.6s",
          animationTimingFunction: "ease-out",
          animationDelay: "400ms",
          animationFillMode: "both",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Orders Analytics
            </h3>
            <p className="text-sm text-gray-500 mt-1">Day-by-day performance tracking</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Period:</span>
          </div>

          <div className="relative flex-1">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border border-blue-600 rounded-xl hover:shadow-lg transition-all duration-200 w-full justify-between font-medium shadow-md"
            >
              <span className="text-sm">{periodLabels[selectedPeriod]}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden"
                style={{ animation: `scaleIn 0.15s ease-out` }}
              >
                {Object.entries(periodLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPeriod(key as "period1" | "period2" | "period3")
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-all ${
                      selectedPeriod === key
                        ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-semibold border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {selectedPeriod === key && "✓ "}
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200/50 mb-6" />

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Earnings Card */}
          <div
            className="group relative bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200/50 hover:border-purple-300 transition-all duration-300 overflow-hidden"
            style={{
              animationName: animateValues ? "slideInUp" : "none",
              animationDuration: "0.6s",
              animationTimingFunction: "ease-out",
              animationDelay: "100ms",
              animationFillMode: "both",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Your Earnings</span>
                <Zap className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-purple-700">
                <AnimatedCurrencyCounter from={0} to={currentPeriodData.earnings} duration={1200} />
              </div>
              <div className="h-1.5 bg-purple-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-1000"
                  style={{ width: animateValues ? "100%" : "0%" }}
                />
              </div>
            </div>
          </div>

          {/* Placed Orders Card */}
          <div
            className="group relative bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-xl p-5 border border-green-200/50 hover:border-green-300 transition-all duration-300 overflow-hidden"
            style={{
              animationName: animateValues ? "slideInUp" : "none",
              animationDuration: "0.6s",
              animationTimingFunction: "ease-out",
              animationDelay: "150ms",
              animationFillMode: "both",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Placed Orders</span>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl md:text-3xl font-bold text-green-700">
                  <AnimatedCounter from={0} to={currentPeriodData.placed} duration={1200} />
                </div>
                <span className="text-sm font-bold text-green-600">{placedPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-green-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                  style={{ width: animateValues ? `${placedPercentage}%` : "0%" }}
                />
              </div>
            </div>
          </div>

          {/* Cancelled Orders Card */}
          <div
            className="group relative bg-gradient-to-br from-red-50 to-rose-100/50 rounded-xl p-5 border border-red-200/50 hover:border-red-300 transition-all duration-300 overflow-hidden"
            style={{
              animationName: animateValues ? "slideInUp" : "none",
              animationDuration: "0.6s",
              animationTimingFunction: "ease-out",
              animationDelay: "200ms",
              animationFillMode: "both",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Cancelled Orders</span>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl md:text-3xl font-bold text-red-700">
                  <AnimatedCounter from={0} to={currentPeriodData.cancelled} duration={1200} />
                </div>
                <span className="text-sm font-bold text-red-600">{cancelledPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-red-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-1000"
                  style={{ width: animateValues ? `${cancelledPercentage}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-6 border border-gray-200/50">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Daily Performance</h4>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="placedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: "12px" }} tick={{ fill: "#6b7280" }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} tick={{ fill: "#6b7280" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="placed"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#placedAreaGrad)"
                isAnimationActive={true}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="cancelled"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: "#EF4444", r: 3 }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200/50">
            <p className="text-xs text-gray-600 font-medium">Total Orders</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{totalOrders}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200/50">
            <p className="text-xs text-gray-600 font-medium">Success Rate</p>
            <p className="text-lg font-bold text-green-600 mt-1">{placedPercentage.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200/50">
            <p className="text-xs text-gray-600 font-medium">Avg Daily</p>
            <p className="text-lg font-bold text-blue-600 mt-1">{Math.round(currentPeriodData.placed / 10)}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
