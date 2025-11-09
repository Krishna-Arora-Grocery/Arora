"use client"

import { AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { ApprovedOrder, CancellationEntry } from "@/app/employee/cancellation/page"

interface CancellationFormProps {
  selectedOrder: ApprovedOrder
  cancellations: CancellationEntry[]
  onUpdateCancellations: (cancellations: CancellationEntry[]) => void
}

export default function CancellationForm({
  selectedOrder,
  cancellations,
  onUpdateCancellations,
}: CancellationFormProps) {
  const [totalPlaced, setTotalPlaced] = useState(0)
  const [totalCancelled, setTotalCancelled] = useState(0)
  const [totalSuccess, setTotalSuccess] = useState(0)

  useEffect(() => {
    const placed = cancellations.reduce((sum, c) => sum + (c.placed || 0), 0)
    const cancelled = cancellations.reduce((sum, c) => sum + (c.cancelled || 0), 0)
    const success = placed - cancelled

    setTotalPlaced(placed)
    setTotalCancelled(cancelled)
    setTotalSuccess(success)
  }, [cancellations])

  const updateCancellation = (orderDetailId: string, cancelled: number) => {
    const updated = cancellations.map((c) => (c.orderDetailId === orderDetailId ? { ...c, cancelled } : c))
    onUpdateCancellations(updated)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111827] mb-2">Cancellation Details</h2>
      <p className="text-xs text-[#6B7280] mb-6">For each pincode, enter how many orders were cancelled</p>

      <div className="mb-6 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#92400E]">
          Enter cancellation counts carefully. These affect your commission calculation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Table Section */}
        <div className="bg-white border-2 border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
                  <th className="text-left py-4 px-4 font-bold text-xs text-[#6B7280] uppercase tracking-wide">
                    Pincode
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-xs text-[#6B7280] uppercase tracking-wide">
                    ID Type
                  </th>
                  <th className="text-right py-4 px-4 font-bold text-xs text-[#6B7280] uppercase tracking-wide">
                    Placed
                  </th>
                  <th className="text-right py-4 px-4 font-bold text-xs text-[#6B7280] uppercase tracking-wide">
                    Cancelled
                  </th>
                  <th className="text-right py-4 px-4 font-bold text-xs text-[#6B7280] uppercase tracking-wide">
                    Success
                  </th>
                </tr>
              </thead>
              <tbody>
                {cancellations.map((entry, index) => {
                  const success = entry.placed - entry.cancelled
                  const hasError = entry.cancelled > entry.placed

                  return (
                    <motion.tr
                      key={entry.orderDetailId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-[#E5E7EB] hover:bg-[#F0F9FF] transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold text-[#111827] font-mono">{entry.pincode}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded text-[11px] font-bold ${
                            entry.type === "new" ? "bg-[#DBEAFE] text-[#1E40AF]" : "bg-[#FEF3C7] text-[#92400E]"
                          }`}
                        >
                          {entry.type === "new" ? "New" : "Old"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-bold text-[#6B7280] font-mono">{entry.placed}</span>
                        <span className="text-[10px] text-[#9CA3AF] ml-1">orders</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-end">
                          <input
                            type="number"
                            value={entry.cancelled || ""}
                            onChange={(e) =>
                              updateCancellation(entry.orderDetailId, Number.parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                            min={0}
                            max={entry.placed}
                            className={`w-24 px-3 py-2 border-2 rounded-lg text-sm font-mono font-bold text-right transition-all ${
                              hasError
                                ? "border-[#EF4444] bg-[#FEF2F2] text-[#EF4444] focus:ring-[#EF4444]"
                                : "border-[#D1D5DB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20"
                            }`}
                          />
                          {hasError && (
                            <span className="text-[10px] text-[#EF4444] mt-1 font-medium">
                              Cannot exceed {entry.placed}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <motion.span
                          key={success}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="inline-block text-sm font-bold text-[#10B981] font-mono bg-[#ECFDF5] px-3 py-1 rounded"
                        >
                          {success}
                        </motion.span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border-2 border-[#10B981] rounded-xl p-6 shadow-lg h-fit sticky top-4">
          <h3 className="text-sm font-bold text-[#065F46] mb-4 uppercase tracking-wide">Summary</h3>

          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-[#6B7280] mb-1">Total Placed</p>
              <motion.p
                key={totalPlaced}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-[#10B981]"
              >
                {totalPlaced}
                <span className="text-sm text-[#6B7280] ml-1">orders</span>
              </motion.p>
            </div>

            <div>
              <p className="text-[11px] text-[#6B7280] mb-1">Total Cancelled</p>
              <motion.p
                key={totalCancelled}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-[#EF4444]"
              >
                {totalCancelled}
                <span className="text-sm text-[#6B7280] ml-1">orders</span>
              </motion.p>
            </div>

            <div className="h-px bg-[#10B981]/30" />

            <div>
              <p className="text-[11px] text-[#065F46] font-bold mb-1">Successfully Placed</p>
              <motion.p
                key={totalSuccess}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-[#10B981]"
              >
                {totalSuccess}
                <span className="text-sm text-[#6B7280] ml-1">orders</span>
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
