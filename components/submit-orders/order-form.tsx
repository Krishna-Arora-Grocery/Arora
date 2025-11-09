"use client"

import { Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import type { OrderType, OrderEntry, Slot } from "@/app/employee/submit-orders/page"

interface OrderFormProps {
  orderType: OrderType
  newOrders: OrderEntry[]
  oldOrders: OrderEntry[]
  onUpdateNewOrders: (orders: OrderEntry[]) => void
  onUpdateOldOrders: (orders: OrderEntry[]) => void
  selectedSlot: Slot | null
}

export default function OrderForm({
  orderType,
  newOrders,
  oldOrders,
  onUpdateNewOrders,
  onUpdateOldOrders,
  selectedSlot,
}: OrderFormProps) {
  const [newTotal, setNewTotal] = useState(0)
  const [oldTotal, setOldTotal] = useState(0)

  useEffect(() => {
    const newSum = newOrders.reduce((sum, order) => sum + (order.count || 0), 0)
    const oldSum = oldOrders.reduce((sum, order) => sum + (order.count || 0), 0)
    setNewTotal(newSum)
    setOldTotal(oldSum)
  }, [newOrders, oldOrders])

  const addRow = (type: "new" | "old") => {
    if (type === "new") {
      onUpdateNewOrders([...newOrders, { pincode: "", count: 0 }])
    } else {
      onUpdateOldOrders([...oldOrders, { pincode: "", count: 0 }])
    }
  }

  const removeRow = (type: "new" | "old", index: number) => {
    if (type === "new") {
      onUpdateNewOrders(newOrders.filter((_, i) => i !== index))
    } else {
      onUpdateOldOrders(oldOrders.filter((_, i) => i !== index))
    }
  }

  const updateRow = (type: "new" | "old", index: number, field: "pincode" | "count", value: string | number) => {
    if (type === "new") {
      const updated = [...newOrders]
      updated[index] = { ...updated[index], [field]: value }
      onUpdateNewOrders(updated)
    } else {
      const updated = [...oldOrders]
      updated[index] = { ...updated[index], [field]: value }
      onUpdateOldOrders(updated)
    }
  }

  const renderOrderTable = (orders: OrderEntry[], type: "new" | "old", bgColor: string, title: string) => (
    <div className="rounded-xl overflow-hidden border-2 border-[#E5E7EB] shadow-sm">
      <div
        className={`px-5 sm:px-6 py-4 font-bold text-base ${
          type === "new"
            ? "bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border-l-4 border-l-[#3B82F6] text-[#1E40AF]"
            : "bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] border-l-4 border-l-[#F59E0B] text-[#92400E]"
        }`}
      >
        {title}
      </div>

      <div className="p-5 sm:p-6 bg-white">
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div
              key={index}
              className="bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl p-4 hover:border-[#3B82F6] hover:shadow-md transition-all duration-200"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-start">
                {/* Pincode Input */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#374151] mb-2 uppercase tracking-wide">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={order.pincode}
                    onChange={(e) => updateRow(type, index, "pincode", e.target.value)}
                    placeholder="e.g., 110054"
                    maxLength={6}
                    className="w-full px-4 py-3.5 border-2 border-[#D1D5DB] rounded-lg text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all duration-200 bg-white"
                  />
                  {order.pincode && order.pincode.length !== 6 && (
                    <p className="text-xs text-[#EF4444] mt-2 font-medium">Must be 6 digits</p>
                  )}
                </div>

                {/* Order Count Input */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#374151] mb-2 uppercase tracking-wide">
                    Order Count
                  </label>
                  <input
                    type="number"
                    value={order.count || ""}
                    onChange={(e) => updateRow(type, index, "count", Number.parseInt(e.target.value) || 0)}
                    placeholder="e.g., 30"
                    min={1}
                    className="w-full px-4 py-3.5 border-2 border-[#D1D5DB] rounded-lg text-base font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all duration-200 bg-white"
                  />
                  {order.count <= 0 && (
                    <p className="text-xs text-[#EF4444] mt-2 font-medium">Must be greater than 0</p>
                  )}
                </div>

                {/* Delete Button */}
                <div className="flex items-end sm:items-start sm:pt-7">
                  <button
                    onClick={() => removeRow(type, index)}
                    className="w-full sm:w-auto px-4 py-3.5 text-[#6B7280] hover:text-white bg-white hover:bg-[#EF4444] border-2 border-[#E5E7EB] hover:border-[#EF4444] rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm shadow-sm"
                    aria-label="Delete row"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sm:hidden">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => addRow(type)}
          className="w-full mt-5 py-4 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border-2 border-dashed border-[#3B82F6] rounded-xl text-base font-bold text-[#3B82F6] hover:from-[#DBEAFE] hover:to-[#BFDBFE] hover:border-[#2563EB] hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Pincode
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111827] mb-2">Order Details</h2>
      <p className="text-xs text-[#6B7280] mb-6">Add pincodes and order counts</p>

      <div className="mb-6 bg-[#EFF6FF] border border-[#93C5FD] rounded-lg p-4 flex items-start gap-3">
        <svg
          className="w-4 h-4 text-[#3B82F6] mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-xs text-[#1E40AF]">
          Provide accurate pincode and order counts for commission calculation. All fields are required.
        </p>
      </div>

      {orderType === "both" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {renderOrderTable(newOrders, "new", "bg-[#EFF6FF]", "New ID Orders")}
          {renderOrderTable(oldOrders, "old", "bg-[#FEF3C7]", "Old ID Orders")}
        </div>
      ) : orderType === "new" ? (
        renderOrderTable(newOrders, "new", "bg-white border border-[#E5E7EB]", "New ID Orders")
      ) : (
        renderOrderTable(oldOrders, "old", "bg-white border border-[#E5E7EB]", "Old ID Orders")
      )}

      <div className="mt-6 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border-2 border-[#10B981] border-l-4 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#065F46] mb-4">{orderType === "both" ? "Combined Total" : "Summary"}</h3>

        {orderType === "both" ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">New Orders:</span>
              <span className="text-lg font-bold text-[#111827] text-right">{newTotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">Old Orders:</span>
              <span className="text-lg font-bold text-[#111827] text-right">{oldTotal}</span>
            </div>
            <div className="h-px bg-[#10B981]/30" />
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-[#065F46]">Total Orders:</span>
              <span className="text-2xl font-bold text-[#10B981] text-right">{newTotal + oldTotal}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-[#065F46]">Total Orders:</span>
              <span className="text-2xl font-bold text-[#10B981] text-right">
                {orderType === "new" ? newTotal : oldTotal}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
