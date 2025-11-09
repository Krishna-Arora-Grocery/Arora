"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Users, Clock, ShoppingCart } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
} from "recharts"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("November 2025")
  const [selectedPart, setSelectedPart] = useState<1 | 2 | 3>(1)

  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    pendingApprovals: 0,
    ordersPlaced: 0,
    ordersCancelled: 0,
    totalOrders: 0,
    totalCommission: 0,
    dailyData: [] as Array<{ day: number; commission: number; placed: number; cancelled: number }>,
  })

  useEffect(() => {
    // Check admin authentication
    const authToken = localStorage.getItem("admin_auth_token")
    if (!authToken) {
      router.push("/login")
      return
    }

    setIsLoading(false)
  }, [router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("[v0] Fetching dashboard data for:", { selectedMonth, selectedPart })

        // Convert "November 2025" to "2025-11"
        const monthMap: Record<string, string> = {
          January: "01",
          February: "02",
          March: "03",
          April: "04",
          May: "05",
          June: "06",
          July: "07",
          August: "08",
          September: "09",
          October: "10",
          November: "11",
          December: "12",
        }

        const [monthName, year] = selectedMonth.split(" ")
        const monthNum = monthMap[monthName]
        const monthParam = `${year}-${monthNum}`

        const response = await fetch(`/api/admin/stats?month=${monthParam}&part=${selectedPart}`)
        const result = await response.json()

        if (!response.ok) {
          console.error("[v0] Error fetching dashboard stats:", result.error)
          return
        }

        console.log("[v0] Dashboard data fetched:", result.data)

        setDashboardData({
          totalEmployees: result.data.employees_aggregate.aggregate.count,
          pendingApprovals: result.data.pending_orders.aggregate.count,
          ordersPlaced: result.data.ordersPlaced,
          ordersCancelled: result.data.ordersCancelled,
          totalOrders: result.data.totalOrders,
          totalCommission: result.data.totalCommission,
          dailyData: result.data.dailyData,
        })
      } catch (err) {
        console.error("[v0] Dashboard fetch error:", err)
      }
    }

    fetchDashboardData()
  }, [selectedMonth, selectedPart])

  const getMonthPartRange = (part: number): { start: number; end: number } => {
    if (part === 1) return { start: 1, end: 10 }
    if (part === 2) return { start: 11, end: 20 }
    return { start: 21, end: 31 }
  }

  const getMonthInfo = () => {
    const [monthName, year] = selectedMonth.split(" ")
    const monthShort = monthName.slice(0, 3) // e.g., "Nov", "May", "Dec"
    return { monthName, monthShort, year }
  }

  const { monthName, monthShort, year } = getMonthInfo()

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    console.log("[v0] Admin month changed to:", month)
  }

  const partLabels = {
    1: `Part 1 (1-10 ${monthShort})`,
    2: `Part 2 (11-20 ${monthShort})`,
    3: `Part 3 (21-30 ${monthShort})`,
  }

  const successRate =
    dashboardData.totalOrders > 0 ? ((dashboardData.ordersPlaced / dashboardData.totalOrders) * 100).toFixed(1) : "0"
  const cancelRate =
    dashboardData.totalOrders > 0 ? ((dashboardData.ordersCancelled / dashboardData.totalOrders) * 100).toFixed(1) : "0"

  const CommissionTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null

    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg border border-gray-700 text-sm">
        <p className="font-semibold mb-2">
          {monthShort} {label}
        </p>
        <p className="text-purple-300">Commission: ₹{payload[0]?.value?.toLocaleString()}</p>
      </div>
    )
  }

  const OrdersTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null

    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg border border-gray-700 text-sm">
        <p className="font-semibold mb-2">
          {monthShort} {label}
        </p>
        <p className="text-emerald-300">Placed: {payload[0]?.value} orders</p>
        <p className="text-red-300">Cancelled: {payload[1]?.value} orders</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          currentMonth={selectedMonth}
          onMonthChange={handleMonthChange}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Period Selector */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-sm text-gray-600 mt-1">Manage orders, payments, and employees</p>
              </div>

              <div className="flex gap-2">
                {[1, 2, 3].map((part) => (
                  <button
                    key={part}
                    onClick={() => setSelectedPart(part as 1 | 2 | 3)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPart === part
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {partLabels[part as 1 | 2 | 3]}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-6 mb-8">
              {/* First Row: Total Employees and Pending Requests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: Total Employees */}
                <div
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  style={{ animation: "slideInUp 0.6s ease-out", animationDelay: "0ms", animationFillMode: "both" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-md">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Total Employees</p>
                  <p className="text-4xl font-bold text-gray-900 mt-3">{dashboardData.totalEmployees}</p>
                  <p className="text-sm text-gray-500 mt-2">Active employees in system</p>
                </div>

                {/* Card 2: Pending Requests */}
                <div
                  onClick={() => router.push("/admin/approvals")}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-sm border border-orange-100 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:border-orange-300"
                  style={{ animation: "slideInUp 0.6s ease-out", animationDelay: "100ms", animationFillMode: "both" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-orange-600 rounded-xl shadow-md group-hover:bg-orange-700 transition-colors">
                      <Clock className="w-7 h-7 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                      <p className="text-xs font-semibold text-orange-700">Action needed</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Pending Requests</p>
                  <p className="text-4xl font-bold text-orange-600 mt-3">{dashboardData.pendingApprovals}</p>
                  <p className="text-sm text-gray-500 mt-2 group-hover:text-orange-600 transition-colors">
                    Click to review submissions →
                  </p>
                </div>
              </div>

              {/* Second Row: Orders Summary */}
              <div
                className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-sm border border-emerald-100 hover:shadow-lg transition-all duration-300"
                style={{ animation: "slideInUp 0.6s ease-out", animationDelay: "200ms", animationFillMode: "both" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-600 rounded-xl shadow-md">
                    <ShoppingCart className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-base text-gray-600 font-semibold uppercase tracking-wide">Orders Summary</p>
                    <p className="text-xs text-gray-500">{partLabels[selectedPart]}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Orders */}
                  <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <p className="text-sm text-gray-700 font-medium">Total Orders</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{dashboardData.totalOrders}</p>
                  </div>

                  {/* Successfully Placed */}
                  <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <p className="text-sm text-gray-700 font-medium">Successful</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{dashboardData.ordersPlaced}</p>
                  </div>

                  {/* Cancelled Orders */}
                  <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <p className="text-sm text-gray-700 font-medium">Cancelled</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{dashboardData.ordersCancelled}</p>
                  </div>
                </div>

                {/* Success Rate Bar */}
                <div className="pt-4 mt-4 border-t border-emerald-100">
                  <div className="flex justify-between text-xs text-gray-600 mb-2 font-medium">
                    <span>Success: {successRate}%</span>
                    <span>Cancel: {cancelRate}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${successRate}%` }}
                    />
                    <div
                      className="bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-1000"
                      style={{ width: `${cancelRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 1: Daily Commission Analysis */}
            <div
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 mb-6"
              style={{ animation: "slideInUp 0.6s ease-out", animationDelay: "500ms", animationFillMode: "both" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Daily Commission Analysis</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Combined commission across all employees ({partLabels[selectedPart]})
                  </p>
                </div>
              </div>
              <div className="border-b border-gray-200 mb-6" />

              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dashboardData.dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="commissionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 12 }} />
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
                  <Tooltip content={<CommissionTooltip />} />
                  <Bar dataKey="commission" fill="url(#commissionGradient)" radius={[8, 8, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-100">
                <div className="w-3 h-3 rounded bg-gradient-to-b from-purple-600 to-purple-300" />
                <span className="text-sm text-gray-700">Total Commission (₹)</span>
              </div>
            </div>

            {/* Chart 2: Daily Orders Analysis */}
            <div
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
              style={{ animation: "slideInUp 0.6s ease-out", animationDelay: "600ms", animationFillMode: "both" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Daily Orders Analysis</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Combined order metrics across all employees ({partLabels[selectedPart]})
                  </p>
                </div>
              </div>
              <div className="border-b border-gray-200 mb-6" />

              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={dashboardData.dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="placedAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    width={50}
                    label={{
                      value: "Orders",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#6B7280", fontSize: 12 },
                    }}
                  />
                  <Tooltip content={<OrdersTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="placed"
                    stroke="#10B981"
                    strokeWidth={3}
                    fill="url(#placedAreaGradient)"
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="cancelled"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ fill: "#EF4444", r: 4 }}
                    animationDuration={1000}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-sm text-gray-700">Successfully Placed Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span className="text-sm text-gray-700">Cancelled Orders</span>
                </div>
              </div>
            </div>
          </div>
        </main>
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
      `}</style>
    </div>
  )
}
