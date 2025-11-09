"use client"

import React from "react"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import DashboardHeader from "@/components/dashboard-header"
import { Search, ChevronDown, ChevronUp, Calendar, Package, X, Pencil, Check, XCircle, Clock } from "lucide-react"

interface PincodeDetail {
  pincode: string
  type: "new" | "old"
  placed: number
  cancelled: number
  earning: number
}

interface OrderRecord {
  id: string
  slotName: string
  slotDate: string
  orderType: "new" | "old" | "both"
  totalOrders: number
  status:
    | "pending"
    | "submitted"
    | "approved"
    | "cancellation_pending"
    | "cancellation_submitted"
    | "complete"
    | "rejected"
  estimatedEarning: number
  submittedAt: string
  approvedAt?: string
  cancelledAt?: string
  completedAt?: string
  rejectionReason?: string
  pincodes: PincodeDetail[]
  cancellationDeadline?: string // e.g., "2025-01-06T18:00:00"
}

const mockOrders: OrderRecord[] = [
  {
    id: "order1",
    slotName: "4 Jan Slot",
    slotDate: "2025-01-04",
    orderType: "both",
    totalOrders: 250,
    status: "complete",
    estimatedEarning: 3750,
    submittedAt: "2025-01-04T14:30:00",
    approvedAt: "2025-01-04T15:15:00",
    cancelledAt: "2025-01-04T17:00:00",
    completedAt: "2025-01-04T18:30:00",
    cancellationDeadline: "2025-01-04T18:00:00",
    pincodes: [
      { pincode: "110054", type: "new", placed: 100, cancelled: 10, earning: 1350 },
      { pincode: "110055", type: "old", placed: 150, cancelled: 20, earning: 1950 },
    ],
  },
  {
    id: "order2",
    slotName: "5 Jan Slot",
    slotDate: "2025-01-05",
    orderType: "new",
    totalOrders: 180,
    status: "approved",
    estimatedEarning: 2700,
    submittedAt: "2025-01-05T14:30:00",
    approvedAt: "2025-01-05T15:15:00",
    cancellationDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    pincodes: [
      { pincode: "110056", type: "new", placed: 100, cancelled: 0, earning: 1500 },
      { pincode: "110057", type: "new", placed: 80, cancelled: 0, earning: 1200 },
    ],
  },
  {
    id: "order3",
    slotName: "3 Jan Slot",
    slotDate: "2025-01-03",
    orderType: "old",
    totalOrders: 120,
    status: "rejected",
    estimatedEarning: 1800,
    submittedAt: "2025-01-03T14:30:00",
    rejectionReason: "Incorrect pincode format",
    cancellationDeadline: "2025-01-03T18:00:00",
    pincodes: [{ pincode: "110058", type: "old", placed: 120, cancelled: 0, earning: 1800 }],
  },
  {
    id: "order4",
    slotName: "6 Jan Slot",
    slotDate: "2025-01-06",
    orderType: "both",
    totalOrders: 300,
    status: "cancellation_submitted",
    estimatedEarning: 4200,
    submittedAt: "2025-01-06T14:30:00",
    approvedAt: "2025-01-06T15:15:00",
    cancelledAt: "2025-01-06T17:00:00",
    cancellationDeadline: "2025-01-06T18:00:00",
    pincodes: [
      { pincode: "110059", type: "new", placed: 150, cancelled: 15, earning: 2025 },
      { pincode: "110060", type: "old", placed: 150, cancelled: 10, earning: 2100 },
    ],
  },
  {
    id: "order5",
    slotName: "2 Jan Slot",
    slotDate: "2025-01-02",
    orderType: "new",
    totalOrders: 200,
    status: "submitted",
    estimatedEarning: 3000,
    submittedAt: "2025-01-02T14:30:00",
    cancellationDeadline: "2025-01-02T18:00:00",
    pincodes: [{ pincode: "110061", type: "new", placed: 200, cancelled: 0, earning: 3000 }],
  },
]

const statusConfig = {
  pending: { bg: "#F3F4F6", text: "#9CA3AF", icon: "⏳", label: "Pending" },
  submitted: { bg: "#EFF6FF", text: "#3B82F6", icon: "✓", label: "Submitted" },
  approved: { bg: "#D1FAE5", text: "#065F46", icon: "✓", label: "Approved" },
  cancellation_pending: { bg: "#FEF3C7", text: "#92400E", icon: "⏳", label: "Cancel Pending" },
  cancellation_submitted: { bg: "#FEF3C7", text: "#92400E", icon: "✓", label: "Cancel Submitted" },
  complete: { bg: "#D1FAE5", text: "#065F46", icon: "✓", label: "Complete" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", icon: "✗", label: "Rejected" },
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string>("slotDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editedPincodes, setEditedPincodes] = useState<Record<string, number>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const authToken = localStorage.getItem("auth_token")
    if (!authToken) {
      router.push("/")
      return
    }
    setIsLoading(false)
  }, [router])

  const canEditOrder = (order: OrderRecord): boolean => {
    // Simple rule: If current_time < cancellation_deadline, can edit
    // Ignore approval status completely
    if (!order.cancellationDeadline) return false
    const deadline = new Date(order.cancellationDeadline)
    return currentTime < deadline
  }

  const getTimeLeft = (deadline: string): { hours: number; minutes: number; seconds: number; total: number } => {
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - currentTime.getTime()

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, total: 0 }
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { hours, minutes, seconds, total: diff }
  }

  const getDeadlineState = (order: OrderRecord): "editable" | "urgent" | "expired" | "locked" => {
    if (!order.cancellationDeadline) return "locked"

    const timeLeft = getTimeLeft(order.cancellationDeadline)

    if (timeLeft.total <= 0) return "expired"
    if (timeLeft.total < 15 * 60 * 1000) return "urgent" // Less than 15 minutes
    return "editable"
  }

  const enterEditMode = (order: OrderRecord) => {
    setEditingOrderId(order.id)
    const initialValues: Record<string, number> = {}
    order.pincodes.forEach((p) => {
      initialValues[p.pincode] = p.cancelled
    })
    setEditedPincodes(initialValues)
    setValidationErrors({})

    // Expand the row if not already expanded
    if (!expandedRows.has(order.id)) {
      toggleRow(order.id)
    }
  }

  const exitEditMode = () => {
    setEditingOrderId(null)
    setEditedPincodes({})
    setValidationErrors({})
  }

  const handleCancelledChange = (pincode: string, placed: number, value: string) => {
    const numValue = Number.parseInt(value) || 0

    // Validate
    if (numValue < 0) {
      setValidationErrors({ ...validationErrors, [pincode]: "Cannot be negative" })
      return
    }

    if (numValue > placed) {
      setValidationErrors({ ...validationErrors, [pincode]: "Cannot exceed placed orders" })
    } else {
      const newErrors = { ...validationErrors }
      delete newErrors[pincode]
      setValidationErrors(newErrors)
    }

    setEditedPincodes({ ...editedPincodes, [pincode]: numValue })
  }

  const saveChanges = async (order: OrderRecord) => {
    // Check if there are any validation errors
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    // Check deadline again
    if (!canEditOrder(order)) {
      setToastMessage("Editing period has ended")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      exitEditMode()
      return
    }

    setIsSaving(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Update the order (in real app, this would be an API call)
    console.log("[v0] Saving changes for order:", order.id, editedPincodes)

    setIsSaving(false)
    setToastMessage("Changes saved successfully!")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    exitEditMode()
  }

  const filteredOrders = useMemo(() => {
    let filtered = mockOrders

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.slotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.pincodes.some((p) => p.pincode.includes(searchQuery)),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((order) => order.orderType === typeFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof OrderRecord]
      let bVal: any = b[sortColumn as keyof OrderRecord]

      if (sortColumn === "slotDate") {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })

    return filtered
  }, [searchQuery, statusFilter, typeFilter, sortColumn, sortDirection])

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setTypeFilter("all")
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all" || typeFilter !== "all"

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} currentMonth="January 2025" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Order History</h1>
              <p className="text-sm text-[#6B7280] mt-1">View all your submitted orders and their status</p>
            </div>

            {showToast && (
              <div className="fixed top-20 right-4 z-50 bg-[#10B981] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slideIn">
                <Check className="w-5 h-5" />
                <span className="font-medium">{toastMessage}</span>
              </div>
            )}

            {/* Filter & Search Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="Search by slot name or pincode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="cancellation_pending">Cancel Pending</option>
                    <option value="cancellation_submitted">Cancel Submitted</option>
                    <option value="complete">Complete</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="all">All Types</option>
                    <option value="new">New IDs</option>
                    <option value="old">Old IDs</option>
                    <option value="both">Both</option>
                  </select>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 px-3 py-2 text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  )}

                  <span className="text-xs text-[#6B7280] ml-auto">
                    Showing {filteredOrders.length} result{filteredOrders.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="bg-[#F0F9FF] border-2 border-dashed border-[#3B82F6] rounded-xl p-16 text-center">
                <Package className="w-12 h-12 text-[#3B82F6] opacity-50 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#6B7280] mb-2">No orders found</h3>
                <p className="text-sm text-[#6B7280] mb-6">
                  {hasActiveFilters
                    ? "Try adjusting your filters or search query"
                    : "You haven't submitted any orders. Start by creating one!"}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={() => router.push("/employee/submit-orders")}
                    className="px-6 py-3 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] transition-colors"
                  >
                    Submit Your First Order
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#E5E7EB] bg-[#F9FAFB]">
                        <th
                          onClick={() => handleSort("slotName")}
                          className="text-left py-4 px-4 font-bold text-[#6B7280] uppercase tracking-wide text-xs cursor-pointer hover:text-[#111827] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            Slot
                            {sortColumn === "slotName" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("slotDate")}
                          className="text-left py-4 px-4 font-bold text-[#6B7280] uppercase tracking-wide text-xs cursor-pointer hover:text-[#111827] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            Date
                            {sortColumn === "slotDate" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </th>
                        <th className="text-left py-4 px-4 font-bold text-[#6B7280] uppercase tracking-wide text-xs">
                          Type
                        </th>
                        <th
                          onClick={() => handleSort("totalOrders")}
                          className="text-left py-4 px-4 font-bold text-[#6B7280] uppercase tracking-wide text-xs cursor-pointer hover:text-[#111827] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            Orders
                            {sortColumn === "totalOrders" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </th>
                        <th className="text-left py-4 px-4 font-bold text-[#6B7280] uppercase tracking-wide text-xs">
                          Status
                        </th>
                        <th
                          onClick={() => handleSort("estimatedEarning")}
                          className="text-left py-4 px-4 font-bold text-[#6B7280] uppercase tracking-wide text-xs cursor-pointer hover:text-[#111827] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            Earning
                            {sortColumn === "estimatedEarning" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </th>
                        <th className="text-left py-4 px-4 font-bold text-[#6B7280] uppercase tracking-wide text-xs">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order, index) => {
                        const isExpanded = expandedRows.has(order.id)
                        const isEditing = editingOrderId === order.id
                        const statusInfo = statusConfig[order.status]
                        const typeColors = {
                          new: { bg: "#EFF6FF", text: "#1E40AF" },
                          old: { bg: "#FEF3C7", text: "#92400E" },
                          both: { bg: "#F3E8FF", text: "#6B21A8" },
                        }
                        const typeColor = typeColors[order.orderType]
                        const deadlineState = getDeadlineState(order)
                        const canEdit = canEditOrder(order)

                        return (
                          <React.Fragment key={order.id}>
                            <tr
                              className={`border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-all duration-200 ${
                                isEditing ? "bg-[#FFFACD]" : ""
                              }`}
                              style={{
                                animation: `fadeIn 0.3s ease-out ${index * 30}ms both`,
                              }}
                            >
                              <td className="py-4 px-4">
                                <button
                                  onClick={() => toggleRow(order.id)}
                                  className="text-[#3B82F6] font-semibold hover:underline flex items-center gap-2"
                                >
                                  {order.slotName}
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="py-4 px-4 text-[#6B7280]">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(order.slotDate).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                                >
                                  {order.orderType === "both" ? "Both" : order.orderType === "new" ? "New" : "Old"}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-bold text-[#111827]">{order.totalOrders}</td>
                              <td className="py-4 px-4">
                                <span
                                  className="px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1"
                                  style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                                >
                                  <span>{statusInfo.icon}</span>
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`font-bold text-sm ${
                                    order.status === "rejected" ? "line-through text-[#9CA3AF]" : "text-[#3B82F6]"
                                  }`}
                                >
                                  ₹{order.estimatedEarning.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => saveChanges(order)}
                                        disabled={isSaving || Object.keys(validationErrors).length > 0}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-[#10B981] text-white text-xs font-bold rounded-md hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isSaving ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                        Save
                                      </button>
                                      <button
                                        onClick={exitEditMode}
                                        disabled={isSaving}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-[#E5E7EB] text-[#6B7280] text-xs font-bold rounded-md hover:bg-[#D1D5DB] transition-colors disabled:opacity-50"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {canEdit ? (
                                        <button
                                          onClick={() => enterEditMode(order)}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-[#3B82F6] text-white text-xs font-bold rounded-md hover:bg-[#2563EB] hover:scale-105 transition-all"
                                          title="Edit cancellation counts"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          Edit
                                        </button>
                                      ) : (
                                        <button
                                          disabled
                                          className="flex items-center gap-1 px-3 py-1.5 bg-[#E5E7EB] text-[#9CA3AF] text-xs font-bold rounded-md cursor-not-allowed opacity-60"
                                          title={
                                            deadlineState === "expired"
                                              ? `Editing period ended on ${new Date(order.cancellationDeadline!).toLocaleString()}`
                                              : "This order cannot be edited"
                                          }
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          Edit
                                        </button>
                                      )}
                                      <button
                                        onClick={() => toggleRow(order.id)}
                                        className="text-[#3B82F6] text-xs font-medium hover:font-bold transition-all flex items-center gap-1"
                                      >
                                        View Details
                                        {isExpanded ? (
                                          <ChevronUp className="w-3 h-3" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3" />
                                        )}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Row */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="bg-[#F0F9FF] p-6">
                                  <div className="space-y-6">
                                    {order.status === "approved" && order.cancellationDeadline && (
                                      <div className="flex items-center justify-between bg-white rounded-lg p-4 border-2 border-dashed">
                                        {deadlineState === "expired" ? (
                                          <div className="flex items-center gap-2 text-[#9CA3AF]">
                                            <Clock className="w-5 h-5" />
                                            <span className="text-sm font-bold">
                                              ⏰ Editing period ended on{" "}
                                              {new Date(order.cancellationDeadline).toLocaleString()}
                                            </span>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex items-center gap-2">
                                              <Clock className="w-5 h-5 text-[#3B82F6]" />
                                              <span className="text-sm font-bold text-[#111827]">
                                                Deadline expires in:
                                              </span>
                                            </div>
                                            <div
                                              className={`text-lg font-bold ${
                                                deadlineState === "urgent"
                                                  ? "text-[#EF4444]"
                                                  : deadlineState === "editable"
                                                    ? "text-[#10B981]"
                                                    : "text-[#F59E0B]"
                                              }`}
                                            >
                                              {(() => {
                                                const timeLeft = getTimeLeft(order.cancellationDeadline)
                                                return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
                                              })()}
                                            </div>
                                            {deadlineState === "urgent" && (
                                              <span className="px-3 py-1 bg-[#FEE2E2] text-[#EF4444] text-xs font-bold rounded-full">
                                                ⚠️ Closing soon!
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )}

                                    {/* Order Breakdown */}
                                    <div>
                                      <h4 className="text-sm font-bold text-[#111827] mb-3">Order Breakdown</h4>
                                      <div className="bg-white rounded-lg overflow-hidden border border-[#E5E7EB]">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                              <th className="text-left py-2 px-3 font-semibold text-[#6B7280]">
                                                Pincode
                                              </th>
                                              <th className="text-left py-2 px-3 font-semibold text-[#6B7280]">Type</th>
                                              <th className="text-left py-2 px-3 font-semibold text-[#6B7280]">
                                                Placed
                                              </th>
                                              <th className="text-left py-2 px-3 font-semibold text-[#6B7280]">
                                                Cancelled
                                              </th>
                                              <th className="text-left py-2 px-3 font-semibold text-[#6B7280]">
                                                Success
                                              </th>
                                              <th className="text-left py-2 px-3 font-semibold text-[#6B7280]">
                                                Earning
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {order.pincodes.map((pincode, idx) => {
                                              const editedCancelled = isEditing
                                                ? (editedPincodes[pincode.pincode] ?? pincode.cancelled)
                                                : pincode.cancelled
                                              const success = pincode.placed - editedCancelled
                                              const hasError = validationErrors[pincode.pincode]

                                              return (
                                                <tr key={idx} className="border-b border-[#E5E7EB] last:border-0">
                                                  <td className="py-2 px-3 font-medium">{pincode.pincode}</td>
                                                  <td className="py-2 px-3">
                                                    <span
                                                      className="px-2 py-0.5 rounded text-xs font-medium"
                                                      style={{
                                                        backgroundColor: pincode.type === "new" ? "#EFF6FF" : "#FEF3C7",
                                                        color: pincode.type === "new" ? "#1E40AF" : "#92400E",
                                                      }}
                                                    >
                                                      {pincode.type === "new" ? "New" : "Old"}
                                                    </span>
                                                  </td>
                                                  <td className="py-2 px-3">{pincode.placed}</td>
                                                  <td className="py-2 px-3">
                                                    {isEditing ? (
                                                      <div className="flex flex-col gap-1">
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          max={pincode.placed}
                                                          value={editedCancelled}
                                                          onChange={(e) =>
                                                            handleCancelledChange(
                                                              pincode.pincode,
                                                              pincode.placed,
                                                              e.target.value,
                                                            )
                                                          }
                                                          className={`w-20 px-2 py-1 border-2 rounded-md text-xs font-mono focus:outline-none focus:ring-2 transition-all ${
                                                            hasError
                                                              ? "border-[#EF4444] bg-[#FEE2E2] focus:ring-[#EF4444]"
                                                              : "border-[#3B82F6] bg-[#FFFACD] focus:ring-[#3B82F6]"
                                                          }`}
                                                        />
                                                        {hasError && (
                                                          <span className="text-[10px] text-[#EF4444] font-medium">
                                                            {validationErrors[pincode.pincode]}
                                                          </span>
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <span>{pincode.cancelled}</span>
                                                    )}
                                                  </td>
                                                  <td className="py-2 px-3">
                                                    <span
                                                      className={`font-semibold ${
                                                        isEditing ? "text-[#10B981] animate-pulse" : ""
                                                      }`}
                                                    >
                                                      {success}
                                                    </span>
                                                  </td>
                                                  <td className="py-2 px-3 font-semibold text-[#3B82F6]">
                                                    ₹{pincode.earning}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* Status Timeline */}
                                    <div>
                                      <h4 className="text-sm font-bold text-[#111827] mb-3">Status Timeline</h4>
                                      <div className="space-y-3">
                                        {order.submittedAt && (
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs font-bold">
                                              ✓
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-[#111827]">Submitted</p>
                                              <p className="text-xs text-[#6B7280]">
                                                {new Date(order.submittedAt).toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                        {order.approvedAt && (
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs font-bold">
                                              ✓
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-[#111827]">Approved by admin</p>
                                              <p className="text-xs text-[#6B7280]">
                                                {new Date(order.approvedAt).toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                        {order.cancelledAt && (
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs font-bold">
                                              ✓
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-[#111827]">
                                                Cancellations submitted
                                              </p>
                                              <p className="text-xs text-[#6B7280]">
                                                {new Date(order.cancelledAt).toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                        {order.completedAt && (
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs font-bold">
                                              ✓
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-[#111827]">Complete</p>
                                              <p className="text-xs text-[#6B7280]">
                                                {new Date(order.completedAt).toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                        {order.status === "rejected" && order.rejectionReason && (
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#EF4444] flex items-center justify-center text-white text-xs font-bold">
                                              ✗
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-[#EF4444]">Rejected</p>
                                              <p className="text-xs text-[#6B7280]">
                                                Admin notes: {order.rejectionReason}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    {!isEditing && order.status === "approved" && (
                                      <div>
                                        <button
                                          onClick={() => router.push("/employee/cancellation")}
                                          className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded-lg hover:bg-[#2563EB] transition-colors"
                                        >
                                          Submit Cancellations
                                        </button>
                                      </div>
                                    )}
                                    {order.status === "rejected" && (
                                      <div>
                                        <button
                                          onClick={() => router.push("/employee/submit-orders")}
                                          className="px-4 py-2 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#EA580C] transition-colors"
                                        >
                                          Resubmit Order
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                  {filteredOrders.map((order, index) => {
                    const isExpanded = expandedRows.has(order.id)
                    const isEditing = editingOrderId === order.id
                    const statusInfo = statusConfig[order.status]
                    const typeColors = {
                      new: { bg: "#EFF6FF", text: "#1E40AF" },
                      old: { bg: "#FEF3C7", text: "#92400E" },
                      both: { bg: "#F3E8FF", text: "#6B21A8" },
                    }
                    const typeColor = typeColors[order.orderType]
                    const deadlineState = getDeadlineState(order)
                    const canEdit = canEditOrder(order)

                    return (
                      <div
                        key={order.id}
                        className={`bg-white border rounded-lg p-4 space-y-3 ${
                          isEditing ? "border-[#FFDA6A] shadow-[0_0_0_2px_#FFDA6A]" : "border-[#E5E7EB]"
                        }`}
                        style={{
                          animation: `fadeIn 0.3s ease-out ${index * 30}ms both`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-[#111827] text-lg">{order.slotName}</h3>
                            <p className="text-xs text-[#6B7280] mt-1">
                              {new Date(order.slotDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                          >
                            {order.orderType === "both" ? "Both" : order.orderType === "new" ? "New" : "Old"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className="px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                          >
                            <span>{statusInfo.icon}</span>
                            {statusInfo.label}
                          </span>
                          <span
                            className={`font-bold text-lg ${
                              order.status === "rejected" ? "line-through text-[#9CA3AF]" : "text-[#3B82F6]"
                            }`}
                          >
                            ₹{order.estimatedEarning.toLocaleString()}
                          </span>
                        </div>

                        <div className="text-sm text-[#6B7280]">
                          <span className="font-semibold text-[#111827]">{order.totalOrders}</span> total orders
                        </div>

                        <button
                          onClick={() => toggleRow(order.id)}
                          className="w-full py-2 text-[#3B82F6] text-sm font-medium border border-[#3B82F6] rounded-lg hover:bg-[#EFF6FF] transition-colors flex items-center justify-center gap-2"
                        >
                          {isExpanded ? "Hide Details" : "View Details"}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="pt-4 border-t border-[#E5E7EB] space-y-4">
                            {order.status === "approved" && order.cancellationDeadline && (
                              <div className="flex items-center justify-between bg-white rounded-lg p-4 border-2 border-dashed">
                                {deadlineState === "expired" ? (
                                  <div className="flex items-center gap-2 text-[#9CA3AF]">
                                    <Clock className="w-5 h-5" />
                                    <span className="text-sm font-bold">
                                      ⏰ Editing period ended on {new Date(order.cancellationDeadline).toLocaleString()}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-5 h-5 text-[#3B82F6]" />
                                      <span className="text-sm font-bold text-[#111827]">Deadline expires in:</span>
                                    </div>
                                    <div
                                      className={`text-lg font-bold ${
                                        deadlineState === "urgent"
                                          ? "text-[#EF4444]"
                                          : deadlineState === "editable"
                                            ? "text-[#10B981]"
                                            : "text-[#F59E0B]"
                                      }`}
                                    >
                                      {(() => {
                                        const timeLeft = getTimeLeft(order.cancellationDeadline)
                                        return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
                                      })()}
                                    </div>
                                    {deadlineState === "urgent" && (
                                      <span className="px-3 py-1 bg-[#FEE2E2] text-[#EF4444] text-xs font-bold rounded-full">
                                        ⚠️ Closing soon!
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                            {/* Order Breakdown */}
                            <div>
                              <h4 className="text-sm font-bold text-[#111827] mb-2">Order Breakdown</h4>
                              <div className="space-y-2">
                                {order.pincodes.map((pincode, idx) => {
                                  const editedCancelled = isEditing
                                    ? (editedPincodes[pincode.pincode] ?? pincode.cancelled)
                                    : pincode.cancelled
                                  const success = pincode.placed - editedCancelled
                                  const hasError = validationErrors[pincode.pincode]
                                  return (
                                    <div
                                      key={idx}
                                      className={`rounded-lg p-3 text-xs ${
                                        isEditing && hasError ? "bg-[#FEE2E2]" : "bg-[#F9FAFB]"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold">{pincode.pincode}</span>
                                        <span
                                          className="px-2 py-0.5 rounded text-xs font-medium"
                                          style={{
                                            backgroundColor: pincode.type === "new" ? "#EFF6FF" : "#FEF3C7",
                                            color: pincode.type === "new" ? "#1E40AF" : "#92400E",
                                          }}
                                        >
                                          {pincode.type === "new" ? "New" : "Old"}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-[#6B7280]">
                                        <span>
                                          Placed: {pincode.placed} | Cancelled:{" "}
                                          {isEditing ? (
                                            <input
                                              type="number"
                                              min="0"
                                              max={pincode.placed}
                                              value={editedCancelled}
                                              onChange={(e) =>
                                                handleCancelledChange(pincode.pincode, pincode.placed, e.target.value)
                                              }
                                              className={`w-14 px-1 py-0.5 border-2 rounded-md text-xs font-mono focus:outline-none focus:ring-2 transition-all ${
                                                hasError
                                                  ? "border-[#EF4444] bg-white focus:ring-[#EF4444]"
                                                  : "border-[#3B82F6] bg-white focus:ring-[#3B82F6]"
                                              }`}
                                            />
                                          ) : (
                                            pincode.cancelled
                                          )}
                                        </span>
                                        <span className="font-semibold text-[#3B82F6]">₹{pincode.earning}</span>
                                      </div>
                                      {hasError && (
                                        <span className="text-[10px] text-[#EF4444] font-medium">
                                          {validationErrors[pincode.pincode]}
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Status Timeline */}
                            <div>
                              <h4 className="text-sm font-bold text-[#111827] mb-2">Status Timeline</h4>
                              <div className="space-y-2">
                                {order.submittedAt && (
                                  <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs">
                                      ✓
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-[#111827]">Submitted</p>
                                      <p className="text-xs text-[#6B7280]">
                                        {new Date(order.submittedAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {order.approvedAt && (
                                  <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs">
                                      ✓
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-[#111827]">Approved</p>
                                      <p className="text-xs text-[#6B7280]">
                                        {new Date(order.approvedAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {order.status === "rejected" && order.rejectionReason && (
                                  <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[#EF4444] flex items-center justify-center text-white text-xs">
                                      ✗
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-[#EF4444]">Rejected</p>
                                      <p className="text-xs text-[#6B7280]">{order.rejectionReason}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Actions */}
                            {!isEditing && order.status === "approved" && (
                              <button
                                onClick={() => router.push("/employee/cancellation")}
                                className="w-full py-2 bg-[#3B82F6] text-white text-sm font-medium rounded-lg hover:bg-[#2563EB] transition-colors"
                              >
                                Submit Cancellations
                              </button>
                            )}
                            {order.status === "rejected" && (
                              <button
                                onClick={() => router.push("/employee/submit-orders")}
                                className="w-full py-2 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#EA580C] transition-colors"
                              >
                                Resubmit Order
                              </button>
                            )}
                            {isEditing && (
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  onClick={() => saveChanges(order)}
                                  disabled={Object.keys(validationErrors).length > 0}
                                  className="flex-1 py-2 bg-[#10B981] text-white text-sm font-bold rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSaving ? (
                                    <div className="flex items-center justify-center">
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                  ) : (
                                    "Save Changes"
                                  )}
                                </button>
                                <button
                                  onClick={exitEditMode}
                                  className="flex-1 py-2 bg-[#E5E7EB] text-[#6B7280] text-sm font-bold rounded-lg hover:bg-[#D1D5DB] transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
