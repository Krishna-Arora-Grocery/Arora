"use client"

import { Calendar, Clock, Flag, ChevronDown, Info, Check, Edit, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Slot } from "@/app/employee/submit-orders/page"
import { formatUTCToIST, formatDateIST, getTimeIST } from "@/lib/date-utils"

interface SlotSelectionProps {
  selectedSlot: Slot | null
  onSelectSlot: (slot: Slot, isEditing?: boolean) => void
  onNext?: () => void
  employeeId: string | null
  refreshTrigger?: number // Added refresh trigger prop
}

const cardVariants = {
  normal: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
  selected: {
    scale: 1.05,
    opacity: 1,
    transition: {
      scale: { duration: 0.3, type: "spring", stiffness: 100 },
    },
  },
  deselected: {
    scale: 0.98,
    opacity: 0.4,
    transition: { duration: 0.3 },
  },
  hover: {
    scale: 1.03,
    transition: { duration: 0.15 },
  },
}

const checkmarkVariants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      duration: 0.4,
    },
  },
}

const summaryVariants = {
  hidden: {
    y: -20,
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
}

export default function SlotSelection({
  selectedSlot,
  onSelectSlot,
  onNext,
  employeeId,
  refreshTrigger,
}: SlotSelectionProps) {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSlots = async () => {
      if (!employeeId) return

      try {
        const response = await fetch(`/api/slots/available?employeeId=${employeeId}`)
        const data = await response.json()

        if (data.error) {
          console.error("Error fetching slots:", data.error)
          return
        }

        const slotsWithStatus = data.data.map((slot: any) => {
          return {
            ...slot,
            computedStatus: slot.computedStatus,
          }
        })

        setSlots(slotsWithStatus)
      } catch (error) {
        console.error("Error fetching slots:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSlots()
  }, [employeeId, refreshTrigger])

  const handleSlotClick = (slot: any, isEditing = false) => {
    const transformedSlot: Slot = {
      id: slot.id,
      name: slot.name,
      date: slot.slot_date,
      dayName: new Date(slot.slot_date).toLocaleDateString("en-US", { weekday: "long" }),
      orderDeadline: slot.order_submission_deadline,
      cancellationDeadline: slot.cancellation_submission_deadline,
      commissions: {
        newId: {
          placed: slot.new_id_success_commission || 0,
          cancelled: slot.new_id_cancelled_commission || 0,
        },
        oldId: {
          placed: slot.old_id_success_commission || 0,
          cancelled: slot.old_id_cancelled_commission || 0,
        },
      },
      status: slot.status || "open",
    }

    onSelectSlot(transformedSlot, isEditing)
    if (onNext && !isEditing) {
      setTimeout(() => {
        onNext()
      }, 600)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111827] mb-2">Select a Slot</h2>
      <p className="text-xs text-[#6B7280] mb-6">Choose which slot to submit orders for</p>

      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            variants={summaryVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mb-6 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border-2 border-[#3B82F6] rounded-xl p-5 shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-[#10B981]" />
                  <h3 className="text-sm font-bold text-[#111827]">Selected Slot</h3>
                </div>
                <p className="text-base font-bold text-[#1E40AF] mb-1">{selectedSlot.name}</p>
                <p className="text-xs text-[#6B7280] mb-2">
                  {selectedSlot.dayName}, {formatDateIST(selectedSlot.date, "long")}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-[#6B7280]">
                  <span>📦 Deadline: {getTimeIST(selectedSlot.orderDeadline)}</span>
                  <span>🚫 Cancel by: {getTimeIST(selectedSlot.cancellationDeadline)}</span>
                </div>
              </div>
              <button
                onClick={() => onSelectSlot(selectedSlot)}
                className="text-xs text-[#3B82F6] hover:text-[#2563EB] font-semibold hover:underline transition-all"
              >
                Change Slot
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id
          const isExpanded = expandedSlot === slot.id

          const submission = slot.order_submissions?.[0]
          const hasSubmission = !!submission
          const isApproved = submission?.approval_status === "approved"
          const isPending = submission?.approval_status === "pending"
          const isRejected = submission?.approval_status === "rejected"

          const cancellationSubmission = slot.cancellation_submissions?.[0]
          const hasCancellationSubmission = !!cancellationSubmission
          const cancellationDeadline = slot.cancellation_submission_deadline
            ? new Date(slot.cancellation_submission_deadline)
            : null
          const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // 5 hours 30 minutes
          const cancellationDeadlineIST = cancellationDeadline ? cancellationDeadline.getTime() + IST_OFFSET_MS : null
          const hasMissedCancellationDeadline =
            hasSubmission &&
            !hasCancellationSubmission &&
            cancellationDeadline &&
            Date.now() > cancellationDeadlineIST &&
            (isPending || isApproved)

          const isExpired = slot.computedStatus === "past"

          const isOtherSelected = selectedSlot && selectedSlot.id !== slot.id
          const slotDate = new Date(slot.slot_date)

          const orderDeadlineIST = formatUTCToIST(slot.order_submission_deadline)
          const formattedCancellationDeadlineIST = slot.cancellation_submission_deadline
            ? formatUTCToIST(slot.cancellation_submission_deadline)
            : null

          return (
            <motion.div
              key={slot.id}
              variants={cardVariants}
              initial="normal"
              animate={isExpired ? "normal" : isSelected ? "selected" : isOtherSelected ? "deselected" : "normal"}
              whileHover={!isExpired && !isApproved ? "hover" : undefined}
              className={`relative border-2 rounded-2xl p-6 transition-all duration-200 ${
                isExpired
                  ? "bg-[#F3F4F6] border-[#D1D5DB] opacity-60 cursor-not-allowed grayscale"
                  : isApproved
                    ? "bg-gradient-to-br from-[#D1FAE5] to-white border-[#10B981] shadow-lg"
                    : isPending
                      ? "bg-gradient-to-br from-[#FEF3C7] to-white border-[#F59E0B] shadow-lg"
                      : isRejected
                        ? "bg-gradient-to-br from-[#FEE2E2] to-white border-[#EF4444] shadow-lg"
                        : `bg-white border-[#3B82F6] shadow-[0_12px_32px_rgba(59,130,246,0.2)] cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-br from-[#EFF6FF] to-white ring-4 ring-[#3B82F6]/20"
                              : "hover:shadow-[0_16px_40px_rgba(59,130,246,0.3)]"
                          }`
              }`}
              onClick={() => !isExpired && !isApproved && handleSlotClick(slot, isPending || isRejected)}
            >
              <AnimatePresence>
                {isSelected && !isExpired && (
                  <motion.div
                    variants={checkmarkVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="absolute -top-3 -right-3 w-10 h-10 bg-[#10B981] rounded-full flex items-center justify-center shadow-lg z-10"
                  >
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute top-3 right-3">
                {isExpired ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EF4444] text-white">Expired</span>
                ) : isApproved ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#10B981] text-white">
                    Approved ✓
                  </span>
                ) : isPending ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#F59E0B] text-white">
                    Pending ⏳
                  </span>
                ) : isRejected ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EF4444] text-white">
                    Rejected ✗
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D1FAE5] text-[#065F46] shadow-md">
                    Active 🟢
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between mb-4 mt-6">
                <div className="flex items-center gap-2">
                  <Calendar className={`w-6 h-6 ${isExpired ? "text-[#9CA3AF]" : "text-[#3B82F6]"}`} />
                  <div>
                    <h3 className={`text-base font-bold ${isExpired ? "text-[#9CA3AF]" : "text-[#111827]"}`}>
                      {slot.name}
                    </h3>
                    <p className="text-xs text-[#6B7280]">{formatDateIST(slot.slot_date, "full")}</p>
                  </div>
                </div>
              </div>

              <div className={`h-px mb-4 ${isExpired ? "bg-[#D1D5DB]" : "bg-[#E5E7EB]"}`} />

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <Clock className={`w-4 h-4 mt-0.5 ${isExpired ? "text-[#9CA3AF]" : "text-[#6B7280]"}`} />
                  <div>
                    <p className={`text-[11px] ${isExpired ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>Order Deadline</p>
                    <p className={`text-xs font-bold ${isExpired ? "text-[#9CA3AF]" : "text-[#111827]"}`}>
                      {orderDeadlineIST.dateTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Flag className={`w-4 h-4 mt-0.5 ${isExpired ? "text-[#9CA3AF]" : "text-[#6B7280]"}`} />
                  <div>
                    <p className={`text-[11px] ${isExpired ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                      Cancellation Deadline
                    </p>
                    <p className={`text-xs font-bold ${isExpired ? "text-[#9CA3AF]" : "text-[#111827]"}`}>
                      {formattedCancellationDeadlineIST ? formattedCancellationDeadlineIST.dateTime : "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`h-px mb-4 ${isExpired ? "bg-[#D1D5DB]" : "bg-[#E5E7EB]"}`} />

              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isExpired) {
                      setExpandedSlot(isExpanded ? null : slot.id)
                    }
                  }}
                  disabled={isExpired}
                  className={`flex items-center justify-between w-full text-left ${isExpired ? "cursor-not-allowed" : ""}`}
                >
                  <span className={`text-[11px] font-bold ${isExpired ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                    Commission Rates
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isExpired ? "text-[#9CA3AF]" : "text-[#6B7280]"} ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isExpanded && !isExpired && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1 text-[11px] text-[#6B7280]"
                  >
                    <p>
                      New IDs: ₹{slot.new_id_success_commission || 0} placed / ₹{slot.new_id_cancelled_commission || 0}{" "}
                      cancelled
                    </p>
                    <p>
                      Old IDs: ₹{slot.old_id_success_commission || 0} placed / ₹{slot.old_id_cancelled_commission || 0}{" "}
                      cancelled
                    </p>
                  </motion.div>
                )}
              </div>

              {hasSubmission && (
                <div className="mb-4 p-3 bg-white/50 rounded-lg border border-gray-200">
                  <p className="text-[11px] font-bold text-gray-700 mb-1">Your Submission:</p>
                  <div className="text-[10px] text-gray-600 space-y-0.5">
                    <p>Total Orders: {submission.total_orders}</p>
                    {submission.total_new_id_orders > 0 && <p>New IDs: {submission.total_new_id_orders}</p>}
                    {submission.total_old_id_orders > 0 && <p>Old IDs: {submission.total_old_id_orders}</p>}
                    <p className="text-[9px] text-gray-500 mt-1">
                      Submitted: {formatUTCToIST(submission.submitted_at).fullDateTime}
                    </p>
                  </div>
                </div>
              )}

              {hasMissedCancellationDeadline && (
                <div className="mb-4 p-3 bg-[#FEE2E2] rounded-lg border-2 border-[#EF4444]">
                  <p className="text-[11px] font-bold text-[#991B1B] mb-1 flex items-center gap-1">
                    ⚠️ Commission Penalty Applied
                  </p>
                  <p className="text-[10px] text-[#991B1B] leading-relaxed">
                    You didn't submit cancellation update for this slot. Your commission for this slot is now calculated
                    at the cancelled order rate: ₹
                    {slot.new_id_cancelled_commission || slot.old_id_cancelled_commission || 7} per order for all{" "}
                    {submission.total_orders} orders placed.
                  </p>
                </div>
              )}

              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isExpired && !isApproved) {
                    handleSlotClick(slot, isPending || isRejected)
                  }
                }}
                disabled={isExpired || isApproved}
                whileHover={!isExpired && !isApproved ? { scale: 1.02 } : undefined}
                whileTap={!isExpired && !isApproved ? { scale: 0.98 } : undefined}
                className={`w-full mt-4 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isExpired
                    ? "bg-[#D1D5DB] text-[#9CA3AF] cursor-not-allowed"
                    : isApproved
                      ? "bg-[#10B981] text-white cursor-not-allowed"
                      : isPending || isRejected
                        ? "bg-[#F59E0B] text-white hover:bg-[#D97706] hover:shadow-lg"
                        : isSelected
                          ? "bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30"
                          : "bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:shadow-lg hover:shadow-[#3B82F6]/30"
                }`}
              >
                {isExpired ? (
                  "Expired"
                ) : isApproved ? (
                  <>
                    <Eye className="w-4 h-4" />
                    View Only
                  </>
                ) : isPending || isRejected ? (
                  <>
                    <Edit className="w-4 h-4" />
                    Edit Submission
                  </>
                ) : isSelected ? (
                  "Selected ✓"
                ) : (
                  "Submit Orders"
                )}
              </motion.button>
            </motion.div>
          )
        })}
      </div>

      {slots.length > 0 &&
        !slots.some((slot) => {
          const submission = slot.order_submissions?.[0]
          const isApproved = submission?.approval_status === "approved"
          const isExpired = slot.computedStatus === "past"

          return !isExpired && !isApproved
        }) &&
        !isLoading && (
          <div className="mt-6 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#92400E] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#92400E]">
              No active slot available for today. Please check back when a new slot is created by the admin.
            </p>
          </div>
        )}
    </div>
  )
}
