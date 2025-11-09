"use client"

import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { BarChart3 } from "lucide-react"

interface ChartsSectionProps {
  data: any
}

export default function ChartsSection({ data }: ChartsSectionProps) {
  const orderData = [
    { name: "Placed Orders", value: data.weekly_orders.placed },
    { name: "Cancelled Orders", value: data.weekly_orders.cancelled },
  ]

  const totalOrders = data.weekly_orders.placed + data.weekly_orders.cancelled
  const placedPercentage = ((data.weekly_orders.placed / totalOrders) * 100).toFixed(2)

  const dailyData = data.day_by_day

  return (
    <div className="space-y-6">
      {/* Top Row: 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Orders Breakdown */}
        <div
          className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-all duration-300"
          style={{
            animation: `slideInUp 0.6s ease-out`,
            animationDelay: "400ms",
            animationFillMode: "both",
          }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Weekly Orders Breakdown</h3>
              <p className="text-sm text-gray-600 mt-1">Placed vs Cancelled</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="border-t border-gray-100 pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={orderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-700">Placed Orders - {data.weekly_orders.placed}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-700">Cancelled Orders - {data.weekly_orders.cancelled}</span>
              </div>
            </div>
            <p className="text-center text-sm font-bold text-gray-900 mt-4">Total: {totalOrders} Orders</p>
          </div>
        </div>

        {/* Weekly Income Target */}
        <div
          className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-all duration-300"
          style={{
            animation: `slideInUp 0.6s ease-out`,
            animationDelay: "500ms",
            animationFillMode: "both",
          }}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">Weekly Income Target</h3>
          <p className="text-sm text-gray-600 mb-6">Target Progress</p>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-700">₹{data.weekly_income.toLocaleString()}</span>
                <span className="text-sm font-bold text-blue-600">52.5% Complete</span>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000"
                  style={{
                    width: "52.5%",
                    animation: `progressFill 1.2s ease-out forwards`,
                  }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-purple-500 blur-md opacity-60"
                  style={{
                    width: "52.5%",
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600">Earned</p>
                  <p className="text-lg font-bold text-green-600 mt-1">₹{data.weekly_income.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Target</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">₹10,000</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Average</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">₹750/day</p>
                </div>
              </div>
            </div>

            <button className="w-full mt-4 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors">
              View Details →
            </button>
          </div>
        </div>
      </div>

      {/* Daily Performance Chart - Full Width */}
      <div
        className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-all duration-300"
        style={{
          animation: `slideInUp 0.6s ease-out`,
          animationDelay: "600ms",
          animationFillMode: "both",
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Daily Performance</h3>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorPlaced" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 12 }} tickLine={false} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#colorPlaced)"
              name="Placed Orders"
            />
            <Line type="monotone" dataKey="cancelled" stroke="#EF4444" strokeWidth={2} dot={false} name="Cancelled" />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">170</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">88.2%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Avg Daily</p>
            <p className="text-2xl font-bold text-blue-600">15</p>
          </div>
        </div>
      </div>
    </div>
  )
}
