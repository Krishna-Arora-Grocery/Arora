"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts"
import { DollarSign, TrendingUp, Clock, CheckCircle2, Eye, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PaymentStatus = "pending" | "processing" | "paid"

interface DayWiseEarning {
  day: number
  earning: number
  orders: number
  cancelled: number
}

interface EmployeePayment {
  id: string
  name: string
  totalEarning: number
  pendingAmount: number
  paidAmount: number
  status: PaymentStatus
  lastPaid: string
  dayWiseData: DayWiseEarning[]
}

type MonthPart = 1 | 2 | 3

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<MonthPart>(1)
  const [sortBy, setSortBy] = useState<"earning" | "name" | "status">("earning")
  const [selectedMonth, setSelectedMonth] = useState("November 2025")

  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayment | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | PaymentStatus>("all")
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)

  const getMonthInfo = () => {
    const date = new Date(selectedMonth)
    return {
      fullName: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      shortName: date.toLocaleDateString("en-US", { month: "short" }),
      month: date.getMonth(),
      year: date.getFullYear(),
    }
  }

  const monthInfo = getMonthInfo()

  const partLabels: Record<MonthPart, string> = {
    1: `Part 1 (1-10 ${monthInfo.shortName})`,
    2: `Part 2 (11-20 ${monthInfo.shortName})`,
    3: `Part 3 (21-30 ${monthInfo.shortName})`,
  }

  useEffect(() => {
    const authToken = localStorage.getItem("admin_auth_token")
    if (!authToken) {
      router.push("/login")
      return
    }

    fetchPaymentData()
  }, [router, selectedMonth, selectedPart])

  const fetchPaymentData = async () => {
    setIsLoading(true)
    try {
      const date = new Date(selectedMonth)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const monthParam = `${year}-${month}`

      console.log("[v0] Fetching payment data for:", monthParam, "part:", selectedPart)

      const response = await fetch(`/api/admin/payments?month=${monthParam}&part=${selectedPart}`)
      const data = await response.json()

      if (data.error) {
        console.error("[v0] Error fetching payment data:", data.error)
        setEmployeePayments([])
      } else {
        console.log("[v0] Payment data fetched:", data.employees?.length || 0, "employees")
        setEmployeePayments(data.employees || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching payment data:", error)
      setEmployeePayments([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "bg-green-50 border-green-200 text-green-700"
      case "processing":
        return "bg-blue-50 border-blue-200 text-blue-700"
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-700"
      default:
        return "bg-gray-50 border-gray-200 text-gray-700"
    }
  }

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="w-5 h-5" />
      case "processing":
        return <Clock className="w-5 h-5" />
      case "pending":
        return <AlertCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  const filteredPayments = employeePayments
    .filter((emp) => (paymentStatusFilter === "all" ? true : emp.status === paymentStatusFilter))
    .sort((a, b) => {
      if (sortBy === "earning") return b.totalEarning - a.totalEarning
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "status") {
        const statusOrder: Record<PaymentStatus, number> = {
          pending: 1,
          processing: 2,
          paid: 3,
        }
        return statusOrder[a.status] - statusOrder[b.status]
      }
      return 0
    })

  const stats = {
    totalPayable: filteredPayments.reduce((sum, emp) => sum + emp.totalEarning, 0),
    totalPending: filteredPayments.reduce((sum, emp) => sum + emp.pendingAmount, 0),
    totalPaid: filteredPayments.reduce((sum, emp) => sum + emp.paidAmount, 0),
  }

  const handleMarkPaid = async (employeeId: string, employeeName: string) => {
    if (markingPaidId) return // Prevent multiple clicks

    const confirmed = window.confirm(
      `Mark payment as PAID for ${employeeName}?\n\nThis will record that you have sent the payment for ${partLabels[selectedPart]}.`,
    )

    if (!confirmed) return

    setMarkingPaidId(employeeId)

    try {
      const adminId = localStorage.getItem("admin_id")
      if (!adminId) {
        alert("Admin ID not found. Please log in again.")
        return
      }

      const date = new Date(selectedMonth)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const monthParam = `${year}-${month}`

      console.log("[v0] Marking payment as paid for:", employeeId, monthParam, selectedPart)

      const response = await fetch("/api/admin/payments/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          month: monthParam,
          part: selectedPart,
          adminId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error("[v0] Error marking payment as paid:", data.error)
        alert(`Failed to mark payment as paid: ${data.error}`)
      } else {
        console.log("[v0] Payment marked as paid successfully")
        alert(`Payment marked as paid for ${employeeName}!`)
        // Refresh payment data
        fetchPaymentData()
      }
    } catch (error) {
      console.error("[v0] Error marking payment as paid:", error)
      alert("Failed to mark payment as paid. Please try again.")
    } finally {
      setMarkingPaidId(null)
    }
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
          onMonthChange={setSelectedMonth}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Payments Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Track and manage employee commission payments for {monthInfo.fullName}
              </p>
            </div>

            {/* Period Selector */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                {[1, 2, 3].map((part) => (
                  <button
                    key={part}
                    onClick={() => setSelectedPart(part as MonthPart)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPart === part
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {partLabels[part as MonthPart]}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Select value={paymentStatusFilter} onValueChange={(value: any) => setPaymentStatusFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">Earning (High to Low)</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Payable */}
              <div
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                style={{ animation: "slideInUp 0.6s ease-out", animationDelay: "0ms", animationFillMode: "both" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 font-medium">Total Payable</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">₹{stats.totalPayable.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">{filteredPayments.length} employees</p>
              </div>

              {/* Total Pending */}
              <div
                className="bg-white rounded-xl p-6 shadow-sm border border-yellow-200 hover:shadow-md transition-all"
                style={{ animation: "slideInUp 0.6s ease-out", animationDelay: "100ms", animationFillMode: "both" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 font-medium">Pending Payments</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">₹{stats.totalPending.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">Awaiting processing</p>
              </div>

              {/* Total Paid */}
              <div
                className="bg-white rounded-xl p-6 shadow-sm border border-green-200 hover:shadow-md transition-all"
                style={{ animation: "slideInUp 0.6s ease-out", animationDelay: "200ms", animationFillMode: "both" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 font-medium">Paid Payments</p>
                <p className="text-3xl font-bold text-green-600 mt-2">₹{stats.totalPaid.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">Successfully processed</p>
              </div>
            </div>

            {/* Employee Payment Cards */}
            <div className="space-y-4">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((employee, index) => (
                  <div
                    key={employee.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                    style={{
                      animation: "slideInUp 0.6s ease-out",
                      animationDelay: `${300 + index * 50}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      {/* Employee Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={getStatusColor(employee.status)}>
                                <span className="mr-1">{getStatusIcon(employee.status)}</span>
                                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Last paid:{" "}
                                {employee.lastPaid !== "N/A"
                                  ? new Date(employee.lastPaid).toLocaleDateString("en-IN")
                                  : "Never"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Total Earning</p>
                            <p className="text-xl font-bold text-gray-900">₹{employee.totalEarning.toLocaleString()}</p>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-50 to-white p-3 rounded-lg border border-yellow-200">
                            <p className="text-xs text-gray-600 mb-1">Pending</p>
                            <p className="text-xl font-bold text-yellow-600">
                              ₹{employee.pendingAmount.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-white p-3 rounded-lg border border-green-200">
                            <p className="text-xs text-gray-600 mb-1">Paid</p>
                            <p className="text-xl font-bold text-green-600">₹{employee.paidAmount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setShowAnalysisModal(true)
                          }}
                          variant="outline"
                          className="flex-1 md:flex-none"
                        >
                          <Eye className="w-4 h-4" />
                          See Analysis
                        </Button>
                        <Button
                          onClick={() => handleMarkPaid(employee.id, employee.name)}
                          disabled={employee.status === "paid" || markingPaidId === employee.id}
                          className={`flex-1 md:flex-none ${
                            employee.status === "paid"
                              ? "bg-gray-400 cursor-not-allowed"
                              : employee.status === "pending"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {markingPaidId === employee.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : employee.status === "paid" ? (
                            "Paid"
                          ) : (
                            "Mark Paid"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No payments found</h3>
                  <p className="text-sm text-gray-600">No employee submissions found for this period</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Analysis Modal */}
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Payment Analysis - {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription>Day-by-day earnings breakdown for {partLabels[selectedPart]}</DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* Chart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={selectedEmployee.dayWiseData}>
                    <defs>
                      <linearGradient id="earningGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#C084FC" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" label={{ value: "Day", position: "insideBottomRight", offset: -5 }} />
                    <YAxis label={{ value: "Earning (₹)", angle: -90, position: "insideLeft" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => `₹${value}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="earning"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ fill: "#8B5CF6", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Daily Earning (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Details Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Day</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Earning</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Orders Placed</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Orders Cancelled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployee.dayWiseData.map((day, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">Day {day.day}</td>
                        <td className="text-right px-4 py-3 font-semibold text-purple-600">
                          ₹{day.earning.toLocaleString()}
                        </td>
                        <td className="text-right px-4 py-3 text-gray-700">{day.orders}</td>
                        <td className="text-right px-4 py-3 text-red-600">{day.cancelled}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                      <td className="text-right px-4 py-3 font-bold text-purple-600">
                        ₹{selectedEmployee.dayWiseData.reduce((sum, d) => sum + d.earning, 0).toLocaleString()}
                      </td>
                      <td className="text-right px-4 py-3 font-bold text-gray-900">
                        {selectedEmployee.dayWiseData.reduce((sum, d) => sum + d.orders, 0)}
                      </td>
                      <td className="text-right px-4 py-3 font-bold text-red-600">
                        {selectedEmployee.dayWiseData.reduce((sum, d) => sum + d.cancelled, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Average Daily Earning</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹
                    {Math.round(
                      selectedEmployee.dayWiseData.reduce((sum, d) => sum + d.earning, 0) /
                        selectedEmployee.dayWiseData.length,
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Orders Placed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedEmployee.dayWiseData.reduce((sum, d) => sum + d.orders, 0)}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">
                    {selectedEmployee.dayWiseData.reduce((sum, d) => sum + d.cancelled, 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
