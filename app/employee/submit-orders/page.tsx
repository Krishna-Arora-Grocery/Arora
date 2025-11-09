"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import DashboardHeader from "@/components/dashboard-header"
import StepIndicator from "@/components/submit-orders/step-indicator"
import SlotSelection from "@/components/submit-orders/slot-selection"
import OrderTypeSelection from "@/components/submit-orders/order-type-selection"
import OrderForm from "@/components/submit-orders/order-form"
import ReviewSubmission from "@/components/submit-orders/review-submission"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"

export type OrderType = "new" | "old" | "both" | null
export type OrderEntry = { pincode: string; count: number }

export interface Slot {
  id: string
  name: string
  date: string
  dayName: string
  orderDeadline: string
  cancellationDeadline: string
  commissions: {
    newId: { placed: number; cancelled: number }
    oldId: { placed: number; cancelled: number }
  }
  status: "open" | "closing-soon" | "closed"
}

export default function SubmitOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [orderType, setOrderType] = useState<OrderType>(null)
  const [newOrders, setNewOrders] = useState<OrderEntry[]>([{ pincode: "", count: 0 }])
  const [oldOrders, setOldOrders] = useState<OrderEntry[]>([{ pincode: "", count: 0 }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const user = getCurrentUser()

    if (!user) {
      router.push("/")
      return
    }

    setEmployeeId(user.id)
    console.log("[v0] Employee ID:", user.id)
    setIsLoading(false)
  }, [router])

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const loadExistingSubmission = async (slotId: string) => {
    try {
      console.log("[v0] Loading existing submission for slot:", slotId)

      const response = await fetch(`/api/slots/available?employeeId=${employeeId}`)
      const data = await response.json()

      const slot = data.data.find((s: any) => s.id === slotId)
      const submission = slot?.order_submissions?.[0]

      if (!submission) return

      // Fetch full submission details
      const detailsResponse = await fetch(`/api/submissions/orders/${submission.id}`)
      const detailsData = await detailsResponse.json()

      if (detailsData.error) {
        console.error("[v0] Error loading submission:", detailsData.error)
        return
      }

      const details = detailsData.data
      setSubmissionId(details.id)

      // Populate form with existing data
      const newOrdersList: OrderEntry[] = []
      const oldOrdersList: OrderEntry[] = []

      details.order_details.forEach((detail: any) => {
        if (detail.id_type === "new") {
          newOrdersList.push({ pincode: detail.pincode, count: detail.order_count })
        } else {
          oldOrdersList.push({ pincode: detail.pincode, count: detail.order_count })
        }
      })

      if (newOrdersList.length > 0 && oldOrdersList.length > 0) {
        setOrderType("both")
        setNewOrders(newOrdersList)
        setOldOrders(oldOrdersList)
      } else if (newOrdersList.length > 0) {
        setOrderType("new")
        setNewOrders(newOrdersList)
      } else {
        setOrderType("old")
        setOldOrders(oldOrdersList)
      }

      console.log("[v0] Loaded existing submission data")

      setCurrentStep(3)
    } catch (error) {
      console.error("[v0] Error loading submission:", error)
    }
  }

  const handleSubmit = async () => {
    if (!selectedSlot || !employeeId) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log(isEditMode ? "[v0] Updating order..." : "[v0] Submitting order...")

      const orderDetails: any[] = []

      if (orderType === "new" || orderType === "both") {
        newOrders
          .filter((o) => o.pincode.length === 6 && o.count > 0)
          .forEach((order) => {
            orderDetails.push({
              pincode: order.pincode,
              idType: "new",
              orderCount: order.count,
            })
          })
      }

      if (orderType === "old" || orderType === "both") {
        oldOrders
          .filter((o) => o.pincode.length === 6 && o.count > 0)
          .forEach((order) => {
            orderDetails.push({
              pincode: order.pincode,
              idType: "old",
              orderCount: order.count,
            })
          })
      }

      const url = isEditMode ? `/api/submissions/orders/${submissionId}` : "/api/submissions/orders"
      const method = isEditMode ? "PUT" : "POST"

      const body = isEditMode ? { orderDetails } : { employeeId, slotId: selectedSlot.id, orderDetails }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      console.log(
        isEditMode ? "[v0] Order updated successfully" : "[v0] Order submitted successfully:",
        data.submissionId,
      )

      toast({
        title: isEditMode ? "Order Updated Successfully!" : "Order Submitted Successfully!",
        description: isEditMode ? "Your order has been updated." : "Your order has been submitted for review.",
      })

      setCurrentStep(1)
      setSelectedSlot(null)
      setOrderType(null)
      setNewOrders([{ pincode: "", count: 0 }])
      setOldOrders([{ pincode: "", count: 0 }])
      setIsEditMode(false)
      setSubmissionId(null)

      // Trigger slot list refresh
      setRefreshTrigger((prev) => prev + 1)
    } catch (error: any) {
      console.error("[v0] Error submitting order:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return selectedSlot !== null
    if (currentStep === 2) return orderType !== null
    if (currentStep === 3) {
      if (orderType === "new") {
        return newOrders.some((o) => o.pincode.length === 6 && o.count > 0)
      }
      if (orderType === "old") {
        return oldOrders.some((o) => o.pincode.length === 6 && o.count > 0)
      }
      if (orderType === "both") {
        return (
          newOrders.some((o) => o.pincode.length === 6 && o.count > 0) &&
          oldOrders.some((o) => o.pincode.length === 6 && o.count > 0)
        )
      }
    }
    return true
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} currentMonth="November 2025" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Submit Orders</h1>
              <p className="text-sm text-[#6B7280] mt-1">Submit your daily order details for verification</p>
            </div>

            <div className="h-px bg-[#E5E7EB] mb-6" />

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Form Container */}
            <div className="bg-white rounded-[20px] shadow-lg p-6 md:p-10 mt-8">
              {currentStep === 1 && (
                <SlotSelection
                  selectedSlot={selectedSlot}
                  onSelectSlot={async (slot, isEditing = false) => {
                    setSelectedSlot(slot)
                    setIsEditMode(!!isEditing)

                    if (isEditing) {
                      await loadExistingSubmission(slot.id)
                    }
                  }}
                  onNext={handleNext}
                  employeeId={employeeId}
                  refreshTrigger={refreshTrigger}
                />
              )}

              {currentStep === 2 && (
                <OrderTypeSelection
                  orderType={orderType}
                  onSelectType={setOrderType}
                  onNext={handleNext}
                  commissionRates={
                    selectedSlot
                      ? {
                          newPlaced: selectedSlot.commissions.newId.placed,
                          newCancelled: selectedSlot.commissions.newId.cancelled,
                          oldPlaced: selectedSlot.commissions.oldId.placed,
                          oldCancelled: selectedSlot.commissions.oldId.cancelled,
                        }
                      : undefined
                  }
                />
              )}

              {currentStep === 3 && (
                <OrderForm
                  orderType={orderType}
                  newOrders={newOrders}
                  oldOrders={oldOrders}
                  onUpdateNewOrders={setNewOrders}
                  onUpdateOldOrders={setOldOrders}
                  selectedSlot={selectedSlot}
                />
              )}

              {currentStep === 4 && (
                <ReviewSubmission
                  selectedSlot={selectedSlot}
                  orderType={orderType}
                  newOrders={newOrders}
                  oldOrders={oldOrders}
                  onEdit={(step) => setCurrentStep(step)}
                />
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-6 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevious}
                      className="px-6 py-2.5 bg-[#F3F4F6] border border-[#D1D5DB] text-[#374151] text-sm font-medium rounded-lg hover:bg-[#E5E7EB] transition-all duration-200"
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/employee/dashboard")}
                    className="text-sm text-[#6B7280] hover:text-[#111827] hover:underline transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {currentStep === 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="px-8 py-2.5 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg disabled:hover:shadow-none"
                  >
                    Next Step
                  </button>
                ) : currentStep === 4 ? (
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
                      "Submit Orders"
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
