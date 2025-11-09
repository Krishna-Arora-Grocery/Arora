"use client"

import { Calendar, Package, Info } from "lucide-react"
import type { OrderType, OrderEntry, Slot } from "@/app/employee/submit-orders/page"
import { formatDateIST, getTimeIST, formatUTCToIST } from "@/lib/date-utils"

interface ReviewSubmissionProps {
  selectedSlot: Slot | null
  orderType: OrderType
  newOrders: OrderEntry[]
  oldOrders: OrderEntry[]
  onEdit: (step: number) => void
}

export default function ReviewSubmission({
  selectedSlot,
  orderType,
  newOrders,
  oldOrders,
  onEdit,
}: ReviewSubmissionProps) {
  const validNewOrders = newOrders.filter((o) => o.pincode.length === 6 && o.count > 0)
  const validOldOrders = oldOrders.filter((o) => o.pincode.length === 6 && o.count > 0)

  const newTotal = validNewOrders.reduce((sum, o) => sum + o.count, 0)
  const oldTotal = validOldOrders.reduce((sum, o) => sum + o.count, 0)
  const totalOrders = newTotal + oldTotal

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111827] mb-2">Review Your Submission</h2>
      <p className="text-xs text-[#6B7280] mb-6">Please verify all details are correct</p>

      <div className="mb-6 bg-[#EFF6FF] border border-[#93C5FD] rounded-lg p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#3B82F6] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#1E40AF]">
          Your submission will be reviewed by admin. Once approved, you can submit cancellation details.
        </p>
      </div>

      <div className="space-y-5">
        {/* Slot Information */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="text-sm font-bold text-[#111827]">Selected Slot</h3>
            </div>
            <button onClick={() => onEdit(1)} className="text-xs text-[#3B82F6] hover:underline font-medium">
              Change
            </button>
          </div>
          <div className="pl-7">
            <p className="text-base font-bold text-[#111827]">{selectedSlot?.name}</p>
            <p className="text-xs text-[#6B7280] mt-1">
              {selectedSlot?.dayName}, {selectedSlot?.date && formatDateIST(selectedSlot.date, "long")}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              Order deadline: {selectedSlot?.orderDeadline && getTimeIST(selectedSlot.orderDeadline)}
            </p>
          </div>
        </div>

        {/* Order Type */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="text-sm font-bold text-[#111827]">Order Type</h3>
            </div>
            <button onClick={() => onEdit(2)} className="text-xs text-[#3B82F6] hover:underline font-medium">
              Change
            </button>
          </div>
          <div className="pl-7">
            <p className="text-base font-bold text-[#111827]">
              {orderType === "new" ? "New IDs" : orderType === "old" ? "Old IDs" : "Both New & Old IDs"}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#111827]">Order Summary</h3>
            <button onClick={() => onEdit(3)} className="text-xs text-[#3B82F6] hover:underline font-medium">
              Change
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#E5E7EB]">
                  <th className="text-left py-3 font-bold text-[#6B7280] uppercase tracking-wide text-xs">Pincode</th>
                  <th className="text-left py-3 font-bold text-[#6B7280] uppercase tracking-wide text-xs">Type</th>
                  <th className="text-right py-3 font-bold text-[#6B7280] uppercase tracking-wide text-xs">Count</th>
                </tr>
              </thead>
              <tbody>
                {validNewOrders.map((order, index) => (
                  <tr key={`new-${index}`} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 text-[#111827]">{order.pincode}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-[#DBEAFE] text-[#1E40AF] rounded text-xs font-medium">New</span>
                    </td>
                    <td className="text-right py-3 text-[#111827] font-medium">{order.count}</td>
                  </tr>
                ))}
                {validOldOrders.map((order, index) => (
                  <tr key={`old-${index}`} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 text-[#111827]">{order.pincode}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-[#FEF3C7] text-[#92400E] rounded text-xs font-medium">Old</span>
                    </td>
                    <td className="text-right py-3 text-[#111827] font-medium">{order.count}</td>
                  </tr>
                ))}
                <tr className="bg-[#F9FAFB] font-bold border-t-2 border-[#E5E7EB]">
                  <td className="py-4 text-[#111827] text-base">TOTAL</td>
                  <td className="py-4 text-[#6B7280]">—</td>
                  <td className="text-right py-4 text-[#111827] text-lg">{totalOrders}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border-2 border-[#10B981] border-l-4 rounded-xl p-6 shadow-md">
          <h3 className="text-base font-bold text-[#065F46] mb-4">Final Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-[#065F46]">Total Orders:</span>
              <span className="text-3xl font-bold text-[#10B981] text-right">{totalOrders}</span>
            </div>
            <div className="h-px bg-[#10B981]/30 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#6B7280]">Submission Time:</span>
              <span className="text-xs text-[#6B7280] text-right">
                {formatUTCToIST(new Date().toISOString()).fullDateTime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
