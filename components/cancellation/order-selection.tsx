"use client"

import { Calendar, Package, Clock, Check, ChevronRight, Lock, AlertCircle, CheckCircle2, Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Order } from "@/app/employee/cancellation/page"
import { formatUTCToIST } from "@/lib/date-utils"
import { useState } from "react"

interface OrderSelectionProps {
  orders: Order[]
  selectedOrder: Order | null
  onSelectOrder: (order: Order) => void
  onNext: () => void
}

export default function OrderSelection({ orders, selectedOrder, onSelectOrder, onNext }: OrderSelectionProps) {
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)

  const handleOrderClick = (order: Order) => {
    if (order.cancellationSubmission?.status === "approved" || (order.isExpired && order.cancellationSubmission)) {
      setViewingOrder(order)
      setViewModalOpen(true)
      return
    }

    if (order.isLocked || order.isExpired) return

    onSelectOrder(order)
    setTimeout(() => {
      onNext()
    }, 600)
  }

  const getStatusBadge = (order: Order) => {
    if (order.isExpired) {
      return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Expired" }
    }

    if (!order.hasSubmission) {
      return { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", label: "No Submission" }
    }

    const orderStatus = order.status
    const cancellationStatus = order.cancellationSubmission?.status

    // If both order and cancellation are approved
    if (orderStatus === "approved" && cancellationStatus === "approved") {
      return { bg: "bg-[#D1FAE5]", text: "text-[#065F46]", label: "Approved" }
    }

    // If both are submitted (pending approval)
    if (cancellationStatus) {
      return { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", label: "Approval Pending" }
    }

    // If only order is submitted
    switch (orderStatus) {
      case "approved":
        return { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]", label: "Order Approved" }
      case "pending":
        return { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", label: "Pending" }
      case "rejected":
        return { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", label: "Rejected" }
    }
  }

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-[#111827] mb-2">Select an Order</h2>
        <p className="text-xs text-[#6B7280] mb-6">Choose which order to add cancellation details for</p>

        <div className="bg-[#F9FAFB] border-2 border-dashed border-[#D1D5DB] rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#111827] mb-2">No Slots Available</h3>
          <p className="text-sm text-[#6B7280] mb-4 max-w-md mx-auto">
            No slots are currently available for cancellation submissions.
          </p>
          <a
            href="/employee/dashboard"
            className="inline-block text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium hover:underline"
          >
            Go to Dashboard →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111827] mb-2">Select an Order</h2>
      <p className="text-xs text-[#6B7280] mb-6">Choose which order to add cancellation details for</p>

      <div className="space-y-4">
        {orders.map((order) => {
          const isSelected = selectedOrder?.id === order.id
          const isOtherSelected = selectedOrder && selectedOrder.id !== order.id
          const statusBadge = getStatusBadge(order)
          const isClickable = !order.isLocked && (!order.isExpired || order.cancellationSubmission)

          return (
            <motion.div
              key={order.slotId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isOtherSelected ? 0.4 : 1, y: 0, scale: isSelected ? 1.02 : 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleOrderClick(order)}
              className={`relative bg-white border-2 rounded-xl p-5 transition-all duration-200 ${
                isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              } ${
                isSelected
                  ? "border-[#3B82F6] shadow-lg shadow-[#3B82F6]/20 bg-[#EFF6FF]"
                  : order.isLocked || (order.isExpired && !order.cancellationSubmission)
                    ? "border-[#E5E7EB] bg-[#F9FAFB]"
                    : "border-[#E5E7EB] hover:border-[#3B82F6] hover:shadow-md"
              }`}
            >
              {order.isLocked && !order.isExpired && (
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#6B7280] rounded-full flex items-center justify-center shadow-lg z-10">
                  <Lock className="w-5 h-5 text-white" />
                </div>
              )}

              {order.cancellationSubmission?.status === "approved" && (
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#10B981] rounded-full flex items-center justify-center shadow-lg z-10">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              )}

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="absolute -top-3 -right-3 w-10 h-10 bg-[#10B981] rounded-full flex items-center justify-center shadow-lg z-10"
                  >
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-[#3B82F6]" />
                    <div>
                      <h3 className="text-base font-bold text-[#111827]">{order.slotName}</h3>
                      <p className="text-xs text-[#6B7280]">
                        {order.dayName}, {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`ml-2 px-3 py-1 ${statusBadge.bg} ${statusBadge.text} text-[11px] font-bold rounded-full`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  {order.isLocked && !order.isExpired ? (
                    <div className="pl-7 flex items-start gap-2 text-xs text-[#DC2626]">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="font-medium">
                        You must submit order details first before adding cancellations
                      </span>
                    </div>
                  ) : order.isExpired && !order.cancellationSubmission ? (
                    <div className="pl-7 flex items-start gap-2 text-xs text-[#6B7280]">
                      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="font-medium">This slot has expired</span>
                    </div>
                  ) : order.isExpired && order.cancellationSubmission ? (
                    <div className="pl-7 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Package className="w-4 h-4 text-[#6B7280]" />
                        <span className="font-medium text-[#111827]">
                          {order.orderType === "both"
                            ? "Both New & Old IDs"
                            : order.orderType === "new"
                              ? "New IDs"
                              : "Old IDs"}
                        </span>
                        <span className="text-[#6B7280]">•</span>
                        <span className="font-bold text-[#111827]">{order.totalPlaced} orders</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2
                          className={`w-4 h-4 ${order.cancellationSubmission.status === "approved" ? "text-[#10B981]" : "text-[#F59E0B]"}`}
                        />
                        <span
                          className={`font-medium ${order.cancellationSubmission.status === "approved" ? "text-[#10B981]" : "text-[#F59E0B]"}`}
                        >
                          {order.cancellationSubmission.status === "approved"
                            ? `Cancellation approved (${order.cancellationSubmission.totalCancelled} cancelled)`
                            : `Approval pending (${order.cancellationSubmission.totalCancelled} cancelled)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-4 h-4 text-[#6B7280]" />
                        <span className="text-[#6B7280] font-medium">
                          Slot expired on: {formatUTCToIST(order.cancellationDeadline).date} at{" "}
                          {formatUTCToIST(order.cancellationDeadline).time}
                        </span>
                      </div>
                    </div>
                  ) : order.cancellationSubmission?.status === "approved" ? (
                    <div className="pl-7 flex items-start gap-2 text-xs text-[#10B981]">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="font-medium">Cancellation approved - This slot is now view-only</span>
                    </div>
                  ) : (
                    <div className="pl-7 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Package className="w-4 h-4 text-[#6B7280]" />
                        <span className="font-medium text-[#111827]">
                          {order.orderType === "both"
                            ? "Both New & Old IDs"
                            : order.orderType === "new"
                              ? "New IDs"
                              : "Old IDs"}
                        </span>
                        <span className="text-[#6B7280]">•</span>
                        <span className="font-bold text-[#111827]">{order.totalPlaced} orders</span>
                      </div>
                      {order.cancellationSubmission && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          <span className="text-[#10B981] font-medium">
                            Cancellation submitted ({order.cancellationSubmission.totalCancelled} cancelled)
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-4 h-4 text-[#F59E0B]" />
                        <span className="text-[#F59E0B] font-medium">
                          Deadline: {formatUTCToIST(order.cancellationDeadline).date} at{" "}
                          {formatUTCToIST(order.cancellationDeadline).time}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  {isSelected ? (
                    <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  ) : order.cancellationSubmission?.status === "approved" ||
                    (order.isExpired && order.cancellationSubmission) ? (
                    <Eye
                      className={`w-6 h-6 ${order.cancellationSubmission.status === "approved" ? "text-[#10B981]" : "text-[#6B7280]"}`}
                    />
                  ) : order.isLocked ? (
                    <Lock className="w-6 h-6 text-[#9CA3AF]" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-[#9CA3AF]" />
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {viewModalOpen && viewingOrder && viewingOrder.cancellationSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#111827]">Cancellation Details</h3>
                <p className="text-sm text-[#6B7280] mt-1">{viewingOrder.slotName} - View Only</p>
              </div>
              <button
                onClick={() => {
                  setViewModalOpen(false)
                  setViewingOrder(null)
                }}
                className="text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {viewingOrder.cancellationSubmission.status === "approved" ? (
                <div className="bg-[#D1FAE5] border border-[#10B981] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                    <span className="text-sm font-bold text-[#065F46]">Approved Submission</span>
                  </div>
                  <p className="text-xs text-[#065F46]">
                    Your cancellation submission has been reviewed and approved by the admin.
                  </p>
                </div>
              ) : viewingOrder.cancellationSubmission.status === "pending" ? (
                <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-[#F59E0B]" />
                    <span className="text-sm font-bold text-[#92400E]">Pending Approval</span>
                  </div>
                  <p className="text-xs text-[#92400E]">
                    Your cancellation submission is awaiting admin review and approval.
                  </p>
                </div>
              ) : (
                <div className="bg-[#FEE2E2] border border-[#EF4444] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                    <span className="text-sm font-bold text-[#991B1B]">Rejected Submission</span>
                  </div>
                  <p className="text-xs text-[#991B1B]">
                    Your cancellation submission was rejected by the admin. Please contact support for details.
                  </p>
                </div>
              )}

              <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
                <h4 className="text-sm font-bold text-[#111827] mb-3">Order Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#6B7280] text-xs">Total Orders Placed</p>
                    <p className="font-bold text-[#111827]">{viewingOrder.totalPlaced}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280] text-xs">Total Cancelled</p>
                    <p className="font-bold text-[#DC2626]">{viewingOrder.cancellationSubmission.totalCancelled}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
                <h4 className="text-sm font-bold text-[#111827] mb-3">Pincode Details</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold text-[#6B7280]">Pincode</th>
                        <th className="text-left py-2 px-3 font-semibold text-[#6B7280]">Type</th>
                        <th className="text-right py-2 px-3 font-semibold text-[#6B7280]">Placed</th>
                        <th className="text-right py-2 px-3 font-semibold text-[#6B7280]">Cancelled</th>
                        <th className="text-right py-2 px-3 font-semibold text-[#6B7280]">Success</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingOrder.pincodes.map((pincode) => (
                        <tr key={pincode.id} className="border-b border-[#E5E7EB] last:border-0">
                          <td className="py-2 px-3 font-medium text-[#111827]">{pincode.pincode}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pincode.type === "new" ? "bg-[#DBEAFE] text-[#1E40AF]" : "bg-[#FEF3C7] text-[#92400E]"
                              }`}
                            >
                              {pincode.type === "new" ? "New" : "Old"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-[#111827]">{pincode.placed}</td>
                          <td className="py-2 px-3 text-right font-medium text-[#DC2626]">{pincode.cancelled || 0}</td>
                          <td className="py-2 px-3 text-right font-medium text-[#10B981]">
                            {pincode.placed - (pincode.cancelled || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={() => {
                  setViewModalOpen(false)
                  setViewingOrder(null)
                }}
                className="w-full py-3 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
