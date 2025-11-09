"use client"

import { Calendar, Package, AlertCircle } from "lucide-react"
import type { Order, CancellationEntry } from "@/app/employee/cancellation/page"
import { formatUTCToIST } from "@/lib/date-utils"

interface CancellationReviewProps {
  selectedOrder: Order
  cancellations: CancellationEntry[]
  onEdit: (step: number) => void
}

export default function CancellationReview({ selectedOrder, cancellations, onEdit }: CancellationReviewProps) {
  const totalPlaced = cancellations.reduce((sum, c) => sum + c.placed, 0)
  const totalCancelled = cancellations.reduce((sum, c) => sum + c.cancelled, 0)
  const totalSuccess = totalPlaced - totalCancelled

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111827] mb-2">Review Cancellation Submission</h2>
      <p className="text-xs text-[#6B7280] mb-6">Verify all cancellation details before submitting</p>

      <div className="mb-6 bg-[#EFF6FF] border border-[#93C5FD] rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[#3B82F6] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#1E40AF]">
          After you submit, admin will verify these details. You'll receive confirmation once complete.
        </p>
      </div>

      <div className="space-y-5">
        {/* Order Information */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="text-sm font-bold text-[#111827]">Order Information</h3>
            </div>
            <button onClick={() => onEdit(1)} className="text-xs text-[#3B82F6] hover:underline font-medium">
              Change
            </button>
          </div>
          <div className="pl-7 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280]">Slot:</span>
              <span className="text-sm font-bold text-[#111827]">{selectedOrder.slotName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280]">Date:</span>
              <span className="text-sm text-[#111827]">
                {selectedOrder.dayName}, January {selectedOrder.date.split("-")[2]}, 2025
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280]">Order Type:</span>
              <span className="text-sm font-medium text-[#111827]">
                {selectedOrder.orderType === "both"
                  ? "Both New & Old IDs"
                  : selectedOrder.orderType === "new"
                    ? "New IDs"
                    : "Old IDs"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280]">Total Orders Submitted:</span>
              <span className="text-sm font-bold text-[#111827]">{selectedOrder.totalPlaced}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Summary Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="text-sm font-bold text-[#111827]">Cancellation Summary</h3>
            </div>
            <button onClick={() => onEdit(2)} className="text-xs text-[#3B82F6] hover:underline font-medium">
              Change
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#E5E7EB]">
                  <th className="text-left py-3 font-bold text-[#6B7280] uppercase tracking-wide text-xs">Pincode</th>
                  <th className="text-left py-3 font-bold text-[#6B7280] uppercase tracking-wide text-xs">Type</th>
                  <th className="text-right py-3 font-bold text-[#6B7280] uppercase tracking-wide text-xs">Placed</th>
                  <th className="text-right py-3 font-bold text-[#6B7280] uppercase tracking-wide text-xs">
                    Cancelled
                  </th>
                  <th className="text-right py-3 font-bold text-[#6B7280] uppercase tracking-wide text-xs">Success</th>
                </tr>
              </thead>
              <tbody>
                {cancellations.map((entry, index) => {
                  const success = entry.placed - entry.cancelled
                  return (
                    <tr
                      key={entry.orderDetailId}
                      className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
                    >
                      <td className="py-3 text-[#111827] font-mono font-medium">{entry.pincode}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            entry.type === "new" ? "bg-[#DBEAFE] text-[#1E40AF]" : "bg-[#FEF3C7] text-[#92400E]"
                          }`}
                        >
                          {entry.type === "new" ? "New" : "Old"}
                        </span>
                      </td>
                      <td className="text-right py-3 text-[#111827] font-medium font-mono">{entry.placed}</td>
                      <td className="text-right py-3 text-[#EF4444] font-bold font-mono">{entry.cancelled}</td>
                      <td className="text-right py-3 text-[#10B981] font-bold font-mono">{success}</td>
                    </tr>
                  )
                })}
                <tr className="bg-[#F9FAFB] font-bold border-t-2 border-[#E5E7EB]">
                  <td className="py-4 text-[#111827] text-base">TOTAL</td>
                  <td className="py-4 text-[#6B7280]">—</td>
                  <td className="text-right py-4 text-[#111827] text-base font-mono">{totalPlaced}</td>
                  <td className="text-right py-4 text-[#EF4444] text-base font-mono">{totalCancelled}</td>
                  <td className="text-right py-4 text-[#10B981] text-base font-mono">{totalSuccess}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Final Summary */}
        <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border-l-4 border-[#10B981] rounded-xl p-6 shadow-md">
          <h3 className="text-base font-bold text-[#065F46] mb-4">Final Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">Total Placed Orders:</span>
              <span className="text-lg font-bold text-[#111827]">{totalPlaced}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">Total Cancelled Orders:</span>
              <span className="text-lg font-bold text-[#EF4444]">{totalCancelled}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#065F46]">Successfully Placed:</span>
              <span className="text-xl font-bold text-[#10B981]">{totalSuccess}</span>
            </div>
            <div className="h-px bg-[#10B981]/30 my-2" />
            <div className="flex justify-between items-center text-xs text-[#6B7280]">
              <span>Submission Time:</span>
              <span>{formatUTCToIST(new Date().toISOString()).fullDateTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
