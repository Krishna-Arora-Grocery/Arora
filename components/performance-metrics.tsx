"use client"

import { Award } from "lucide-react"

interface PerformanceMetricsProps {
  data: any
}

export default function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Success Rate Card */}
      <div
        className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-all duration-300"
        style={{
          animation: `slideInUp 0.6s ease-out`,
          animationDelay: "700ms",
          animationFillMode: "both",
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-6">Success Rate</h3>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Order Success</span>
              <span className="text-2xl font-bold text-green-600">{data.success_rate}%</span>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-1000"
                style={{
                  width: `${data.success_rate}%`,
                  animation: `progressFill 1.2s ease-out forwards`,
                }}
              />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Completed Orders</p>
              <p className="text-sm font-bold text-gray-900">
                290 / 350 <span className="text-xs font-normal text-gray-600">orders</span>
              </p>
              <p className="text-xs text-gray-600 mt-2">Average Daily: 50 orders</p>
            </div>
          </div>

          <div className="inline-block px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            Excellent
          </div>
        </div>
      </div>

      {/* Best Day Performance Card */}
      <div
        className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-all duration-300"
        style={{
          animation: `slideInUp 0.6s ease-out`,
          animationDelay: "800ms",
          animationFillMode: "both",
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-6">Best Day Performance</h3>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
            <p className="text-xs text-gray-600 mb-2">Peak Performance Day</p>
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-blue-600" />
              <p className="text-3xl font-bold text-blue-600">{data.best_day}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold">Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{data.best_day_orders}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold">Earnings</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹{data.best_day_earnings}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full w-fit text-xs font-semibold">
            <span>🔥</span> Best Performer
          </div>
        </div>
      </div>
    </div>
  )
}
