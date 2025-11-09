"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import DashboardHeader from "@/components/dashboard-header"
import CancellationStepIndicator from "@/components/cancellation/step-indicator"
import OrderSelection from "@/components/cancellation/order-selection"
import CancellationForm from "@/components/cancellation/cancellation-form"
import CancellationReview from "@/components/cancellation/review"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"

export interface Order {
  id: string
  slotId: string
  slotName: string
  date: string
  dayName: string
  status: "pending" | "approved" | "rejected"
  orderType: "new" | "old" | "both"
  totalPlaced: number
  approvedAt?: string
  cancellationDeadline: string
  hasSubmission: boolean
  isExpired: boolean
  isLocked: boolean
  pincodes: Array<{
    id: string
    pincode: string
    type: "new" | "old"
    placed: number
    cancelled?: number
  }>
  commissions: {
    newId: { placed: number; cancelled: number }
    oldId: { placed: number; cancelled: number }
  }
  cancellationSubmission?: {
    id: string
    status: string
    totalCancelled: number
  }
}

export interface CancellationEntry {
  orderDetailId: string
  pincode: string
  type: "new" | "old"
  placed: number
  cancelled: number
}

export default function CancellationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [cancellations, setCancellations] = useState<CancellationEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [employeeId, setEmployeeId] = useState<string>("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }

    setEmployeeId(user.id)
    fetchApprovedOrders(user.id)
  }, [router])

  const fetchApprovedOrders = async (empId: string) => {
    try {
      const response = await fetch(`/api/slots/for-cancellation?employeeId=${empId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch slots")
      }

      const transformedOrders: Order[] = data.slots.map((slot: any) => {
        const slotDate = new Date(slot.slot_date)
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

        const submission = slot.order_submissions?.[0]
        const hasSubmission = !!submission
        const isExpired = slot.computedStatus === "past"
        const isLocked = !hasSubmission

        let orderType: "new" | "old" | "both" = "both"
        if (submission) {
          if (submission.total_new_id_orders > 0 && submission.total_old_id_orders === 0) orderType = "new"
          if (submission.total_old_id_orders > 0 && submission.total_new_id_orders === 0) orderType = "old"
        }

        const cancellationSubmission = submission?.cancellation_submissions?.[0]

        const cancelledMap = new Map<string, number>()
        if (cancellationSubmission?.cancellation_details) {
          cancellationSubmission.cancellation_details.forEach((detail: any) => {
            cancelledMap.set(detail.order_detail_id, detail.cancelled_count)
          })
        }

        return {
          id: submission?.id || slot.id,
          slotId: slot.id,
          slotName: slot.name,
          date: slot.slot_date,
          dayName: dayNames[slotDate.getDay()],
          status: submission?.approval_status || "pending",
          orderType,
          totalPlaced: submission?.total_orders || 0,
          approvedAt: submission?.approved_at,
          cancellationDeadline: slot.cancellation_submission_deadline,
          hasSubmission,
          isExpired,
          isLocked,
          pincodes:
            submission?.order_details?.map((detail: any) => ({
              id: detail.id,
              pincode: detail.pincode,
              type: detail.id_type,
              placed: detail.order_count,
              cancelled: cancelledMap.get(detail.id) || 0,
            })) || [],
          commissions: {
            newId: {
              placed: slot.new_id_success_commission,
              cancelled: slot.new_id_cancelled_commission,
            },
            oldId: {
              placed: slot.old_id_success_commission,
              cancelled: slot.old_id_cancelled_commission,
            },
          },
          cancellationSubmission: cancellationSubmission
            ? {
                id: cancellationSubmission.id,
                status: cancellationSubmission.approval_status,
                totalCancelled: cancellationSubmission.total_cancelled,
              }
            : undefined,
        }
      })

      setOrders(transformedOrders)
    } catch (error) {
      console.error("Error fetching slots:", error)
      toast({
        title: "Error",
        description: "Failed to load slots. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedOrder) {
      if (selectedOrder.cancellationSubmission) {
        fetchExistingCancellationDetails(selectedOrder.cancellationSubmission.id)
      } else {
        const entries: CancellationEntry[] = selectedOrder.pincodes.map((p) => ({
          orderDetailId: p.id,
          pincode: p.pincode,
          type: p.type,
          placed: p.placed,
          cancelled: 0,
        }))
        setCancellations(entries)
      }
    }
  }, [selectedOrder])

  const fetchExistingCancellationDetails = async (cancellationSubmissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/cancellations/${cancellationSubmissionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch cancellation details")
      }

      const entries: CancellationEntry[] = data.cancellation.cancellation_details.map((detail: any) => ({
        orderDetailId: detail.order_detail_id,
        pincode: detail.pincode,
        type: detail.id_type,
        placed: detail.order_detail?.order_count || 0,
        cancelled: detail.cancelled_count,
      }))

      setCancellations(entries)
      setIsEditMode(true)
      setExistingSubmissionId(cancellationSubmissionId)
    } catch (error) {
      console.error("Error fetching cancellation details:", error)
      toast({
        title: "Error",
        description: "Failed to load existing cancellation details.",
        variant: "destructive",
      })
    }
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!selectedOrder || !employeeId) return

    setIsSubmitting(true)

    try {
      const totalCancelled = cancellations.reduce((sum, c) => sum + c.cancelled, 0)
      const totalOldIdCancelled = cancellations.filter((c) => c.type === "old").reduce((sum, c) => sum + c.cancelled, 0)
      const totalNewIdCancelled = cancellations.filter((c) => c.type === "new").reduce((sum, c) => sum + c.cancelled, 0)

      const payload = {
        employeeId,
        slotId: selectedOrder.slotId,
        orderSubmissionId: selectedOrder.id,
        totalCancelled,
        totalOldIdCancelled,
        totalNewIdCancelled,
        cancellationSubmissionId: isEditMode ? existingSubmissionId : undefined,
        cancellationDetails: cancellations.map((c) => ({
          orderDetailId: c.orderDetailId,
          pincode: c.pincode,
          idType: c.type,
          cancelledCount: c.cancelled,
        })),
      }

      const response = await fetch("/api/submissions/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit cancellation")
      }

      toast({
        title: "Cancellation Submitted!",
        description: "Your cancellation details have been submitted for verification.",
      })

      setCurrentStep(1)
      setSelectedOrder(null)
      setCancellations([])
      setIsEditMode(false)
      setExistingSubmissionId(null)
      await fetchApprovedOrders(employeeId)
    } catch (error: any) {
      console.error("Error submitting cancellation:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit cancellation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return selectedOrder !== null && selectedOrder.hasSubmission && !selectedOrder.isExpired
    if (currentStep === 2) {
      return cancellations.every((c) => c.cancelled >= 0 && c.cancelled <= c.placed)
    }
    return true
  }

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
          <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Submit Cancellation Details</h1>
              <p className="text-sm text-[#6B7280] mt-1">Enter cancelled order counts for verification</p>
            </div>

            <div className="h-px bg-[#E5E7EB] mb-6" />

            <CancellationStepIndicator currentStep={currentStep} />

            <div className="bg-white rounded-[20px] shadow-lg p-6 md:p-10 mt-8">
              {currentStep === 1 && (
                <OrderSelection
                  orders={orders}
                  selectedOrder={selectedOrder}
                  onSelectOrder={setSelectedOrder}
                  onNext={handleNext}
                />
              )}

              {currentStep === 2 && selectedOrder && (
                <CancellationForm
                  selectedOrder={selectedOrder}
                  cancellations={cancellations}
                  onUpdateCancellations={setCancellations}
                />
              )}

              {currentStep === 3 && selectedOrder && (
                <CancellationReview
                  selectedOrder={selectedOrder}
                  cancellations={cancellations}
                  onEdit={(step) => setCurrentStep(step)}
                />
              )}

              <div className="flex items-center justify-between gap-4 pt-6 border-t border-[#E5E7EB] mt-8">
                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevious}
                      className="px-6 py-2.5 bg-[#F3F4F6] border border-[#D1D5DB] text-[#374151] text-sm font-medium rounded-lg hover:bg-[#E5E7EB] transition-all duration-200"
                    >
                      ← Previous
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/employee/dashboard")}
                    className="text-sm text-[#6B7280] hover:text-[#111827] hover:underline transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="text-xs text-[#6B7280] font-medium">Step {currentStep} of 3</div>

                {currentStep === 2 && (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="px-8 py-2.5 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg disabled:hover:shadow-none"
                  >
                    Next →
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceed()}
                    className="px-8 py-2.5 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg disabled:hover:shadow-none flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit Cancellation"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
