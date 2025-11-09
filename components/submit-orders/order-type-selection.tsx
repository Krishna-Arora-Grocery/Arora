"use client"

import { Info } from "lucide-react"
import type { OrderType } from "@/app/employee/submit-orders/page"

interface OrderTypeSelectionProps {
  orderType: OrderType
  onSelectType: (type: OrderType) => void
  onNext?: () => void
  commissionRates?: {
    newPlaced: number
    newCancelled: number
    oldPlaced: number
    oldCancelled: number
  }
}

export default function OrderTypeSelection({
  orderType,
  onSelectType,
  onNext,
  commissionRates,
}: OrderTypeSelectionProps) {
  const handleTypeClick = (type: OrderType) => {
    onSelectType(type)
    if (onNext) {
      setTimeout(() => {
        onNext()
      }, 400)
    }
  }

  const orderTypes = [
    {
      value: "new" as const,
      label: "New IDs",
      description: "Submit orders for new customers",
      commission: commissionRates
        ? `Earning: ₹${commissionRates.newPlaced}/placed, ₹${commissionRates.newCancelled}/cancelled`
        : "View commission rates in next step",
    },
    {
      value: "old" as const,
      label: "Old IDs",
      description: "Submit orders for existing customers",
      commission: commissionRates
        ? `Earning: ₹${commissionRates.oldPlaced}/placed, ₹${commissionRates.oldCancelled}/cancelled`
        : "View commission rates in next step",
    },
    {
      value: "both" as const,
      label: "Both New & Old IDs",
      description: "Submit mixed new and old customer orders",
      commission: "Combined earnings",
    },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111827] mb-2">Order Type</h2>
      <p className="text-xs text-[#6B7280] mb-6">What type of orders are you submitting?</p>

      <div className="mb-6 bg-[#EFF6FF] border border-[#93C5FD] rounded-lg p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#3B82F6] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#1E40AF]">
          Choose the order type based on your customer base. You can submit both types in a single submission.
        </p>
      </div>

      <div className="space-y-4">
        {orderTypes.map((type) => {
          const isSelected = orderType === type.value

          return (
            <div
              key={type.value}
              onClick={() => handleTypeClick(type.value)}
              className={`p-5 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                isSelected
                  ? "bg-[#EFF6FF] border-[#3B82F6] shadow-sm"
                  : "bg-white hover:bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#3B82F6]"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio Button */}
                <div className="mt-1">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? "border-[#3B82F6] bg-[#3B82F6]" : "border-[#D1D5DB]"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111827] mb-1">{type.label}</h3>
                  <p className="text-[11px] text-[#6B7280] mb-2">{type.description}</p>
                  <p className="text-[11px] text-[#3B82F6] font-medium">{type.commission}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
