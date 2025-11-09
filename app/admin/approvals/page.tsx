"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Clock, CheckCircle, XCircle, DollarSign, Package, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface Submission {
  id: string
  employeeId: string
  slotId: string
  slotName: string
  slotDate: string
  submissionType: "order" | "cancellation"
  orderType?: "new" | "old" | "both"
  newPlaced?: number
  newCancelled?: number
  oldPlaced?: number
  oldCancelled?: number
  pincodes?: Array<{
    pincode: string
    type: "new" | "old"
    placed: number
    cancelled: number
  }>
  commissionRates: {
    newPlaced: number
    newCancelled: number
    oldPlaced: number
    oldCancelled: number
  }
  totalEarnings: number
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  notes?: string
}

interface Employee {
  id: string
  fullName: string
  username: string
  email: string
  profilePicture?: string
  pendingCount: number
  submissions: Submission[]
}

interface SlotSubmissionGroup {
  slotId: string
  slotName: string
  slotDate: string
  orderSubmission?: Submission
  cancellationSubmission?: Submission
  totalNewPlaced: number
  totalNewCancelled: number
  totalOldPlaced: number
  totalOldCancelled: number
  totalNewSuccessful: number
  totalOldSuccessful: number
  totalEarnings: number
  hasPendingCancellation: boolean
}

const getMonthPart = (date: Date): number => {
  const day = date.getDate()
  if (day <= 10) return 1
  if (day <= 20) return 2
  return 3
}

const getMonthPartRange = (part: number): { start: number; end: number } => {
  if (part === 1) return { start: 1, end: 10 }
  if (part === 2) return { start: 11, end: 20 }
  return { start: 21, end: 31 }
}

const isInSelectedMonthPart = (submissionDate: string, selectedMonth: Date): boolean => {
  const currentPart = getMonthPart(selectedMonth)
  const submission = new Date(submissionDate)
  const submissionMonth = submission.getMonth()
  const submissionYear = submission.getFullYear()

  // Only show submissions from same month and year
  if (submissionMonth !== selectedMonth.getMonth() || submissionYear !== selectedMonth.getFullYear()) {
    return false
  }

  const submissionDay = submission.getDate()
  const range = getMonthPartRange(currentPart)
  return submissionDay >= range.start && submissionDay <= range.end
}

export default function AdminApprovalsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("November 2025")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedSlotGroup, setSelectedSlotGroup] = useState<SlotSubmissionGroup | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  // Removed rejectingSubmissionId as we now store the whole slotGroup
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false)
  const [penaltySlotGroup, setPenaltySlotGroup] = useState<SlotSubmissionGroup | null>(null)
  const [isPenaltyApplying, setIsPenaltyApplying] = useState(false)
  const [penaltyCalculation, setPenaltyCalculation] = useState<any>(null)

  const [employees, setEmployees] = useState<Employee[]>([])

  const fetchEmployeesWithPendingSubmissions = async () => {
    try {
      console.log("[v0] Fetching employees with pending submissions")
      const response = await fetch("/api/admin/approvals/pending")

      if (!response.ok) {
        throw new Error("Failed to fetch pending submissions")
      }

      const data = await response.json()
      const employeesList = data.employees || []
      console.log("[v0] Employees fetched:", employeesList.length)

      const transformedEmployees = employeesList.map((emp: any) => {
        const submissions: Submission[] = []

        // Transform order submissions
        emp.order_submissions?.forEach((orderSub: any) => {
          submissions.push({
            id: orderSub.id,
            employeeId: emp.id,
            slotId: orderSub.slot_id,
            slotName: orderSub.slot.name,
            slotDate: orderSub.slot.slot_date,
            submissionType: "order",
            orderType:
              orderSub.total_new_id_orders > 0 && orderSub.total_old_id_orders > 0
                ? "both"
                : orderSub.total_new_id_orders > 0
                  ? "new"
                  : "old",
            newPlaced: orderSub.total_new_id_orders || 0,
            oldPlaced: orderSub.total_old_id_orders || 0,
            newCancelled: 0,
            oldCancelled: 0,
            pincodes:
              orderSub.order_details?.map((detail: any) => ({
                pincode: detail.pincode,
                type: detail.id_type,
                placed: detail.order_count,
                cancelled: 0,
              })) || [],
            commissionRates: {
              newPlaced: orderSub.slot.new_id_success_commission || 0,
              newCancelled: orderSub.slot.new_id_cancelled_commission || 0,
              oldPlaced: orderSub.slot.old_id_success_commission || 0,
              oldCancelled: orderSub.slot.old_id_cancelled_commission || 0,
            },
            totalEarnings:
              (orderSub.total_new_id_orders || 0) * (orderSub.slot.new_id_success_commission || 0) +
              (orderSub.total_old_id_orders || 0) * (orderSub.slot.old_id_success_commission || 0),
            status: orderSub.approval_status,
            submittedAt: orderSub.submitted_at,
          })
        })

        // Transform cancellation submissions
        emp.cancellation_submissions?.forEach((cancelSub: any) => {
          const relatedOrderSubmission =
            cancelSub.order_submission ||
            emp.order_submissions.find((os: any) => os.id === cancelSub.order_submission_id)

          console.log("[v0] Cancellation submission slot commission rates:", {
            newSuccess: cancelSub.slot.new_id_success_commission,
            newCancelled: cancelSub.slot.new_id_cancelled_commission,
            oldSuccess: cancelSub.slot.old_id_success_commission,
            oldCancelled: cancelSub.slot.old_id_cancelled_commission,
          })

          submissions.push({
            id: cancelSub.id,
            employeeId: emp.id,
            slotId: cancelSub.slot_id,
            slotName: cancelSub.slot.name,
            slotDate: cancelSub.slot.slot_date,
            submissionType: "cancellation",
            newPlaced: relatedOrderSubmission?.total_new_id_orders || 0,
            oldPlaced: relatedOrderSubmission?.total_old_id_orders || 0,
            newCancelled: cancelSub.total_new_id_cancelled || 0,
            oldCancelled: cancelSub.total_old_id_cancelled || 0,
            pincodes: [
              ...(relatedOrderSubmission?.order_details?.map((detail: any) => ({
                pincode: detail.pincode,
                type: detail.id_type,
                placed: detail.order_count,
                cancelled: 0,
              })) || []),
            ].map((orderPc) => {
              const cancelDetail = cancelSub.cancellation_details?.find(
                (cd: any) => cd.pincode === orderPc.pincode && cd.id_type === orderPc.type,
              )
              return {
                ...orderPc,
                cancelled: cancelDetail?.cancelled_count || 0,
              }
            }),
            commissionRates: {
              newPlaced: cancelSub.slot.new_id_success_commission || 0,
              newCancelled: cancelSub.slot.new_id_cancelled_commission || 0,
              oldPlaced: cancelSub.slot.old_id_success_commission || 0,
              oldCancelled: cancelSub.slot.old_id_cancelled_commission || 0,
            },
            totalEarnings: (() => {
              const newPlaced = relatedOrderSubmission?.total_new_id_orders || 0
              const oldPlaced = relatedOrderSubmission?.total_old_id_orders || 0
              const newCancelled = cancelSub.total_new_id_cancelled || 0
              const oldCancelled = cancelSub.total_old_id_cancelled || 0
              const newSuccessful = newPlaced - newCancelled
              const oldSuccessful = oldPlaced - oldCancelled

              const earnings =
                newSuccessful * (cancelSub.slot.new_id_success_commission || 0) +
                oldSuccessful * (cancelSub.slot.old_id_success_commission || 0) +
                newCancelled * (cancelSub.slot.new_id_cancelled_commission || 0) +
                oldCancelled * (cancelSub.slot.old_id_cancelled_commission || 0)

              console.log("[v0] Calculated earnings:", {
                newSuccessful,
                oldSuccessful,
                newCancelled,
                oldCancelled,
                earnings,
              })

              return earnings
            })(),
            status: cancelSub.approval_status,
            submittedAt: cancelSub.submitted_at,
          })
        })

        return {
          id: emp.id,
          fullName: emp.name,
          username: emp.username,
          email: emp.email,
          pendingCount: emp.pendingSlotCount || 0,
          submissions: submissions,
        }
      })

      setEmployees(transformedEmployees)
    } catch (error) {
      console.error("[v0] Error fetching employees:", error)
      toast({
        title: "Error",
        description: "Failed to load pending submissions. Please try again.",
        variant: "destructive",
      })
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const authToken = localStorage.getItem("admin_auth_token")
    if (!authToken) {
      router.push("/login")
      return
    }
    fetchEmployeesWithPendingSubmissions()
  }, [router])

  useEffect(() => {
    if (!isLoading) {
      fetchEmployeesWithPendingSubmissions()
    }
  }, [selectedMonth])

  const getSlotSubmissionGroups = (employee: Employee): SlotSubmissionGroup[] => {
    const slotMap = new Map<string, SlotSubmissionGroup>()

    employee.submissions
      .filter((sub) => sub.status === "pending" && isInSelectedMonthPart(sub.submittedAt, new Date(selectedMonth)))
      .forEach((submission) => {
        const key = submission.slotId
        if (!slotMap.has(key)) {
          slotMap.set(key, {
            slotId: submission.slotId,
            slotName: submission.slotName,
            slotDate: submission.slotDate,
            totalNewPlaced: 0,
            totalNewCancelled: 0,
            totalOldPlaced: 0,
            totalOldCancelled: 0,
            totalNewSuccessful: 0,
            totalOldSuccessful: 0,
            totalEarnings: 0,
            hasPendingCancellation: false,
          })
        }

        const group = slotMap.get(key)!

        if (submission.submissionType === "order") {
          group.orderSubmission = submission
          group.totalNewPlaced = submission.newPlaced || 0
          group.totalOldPlaced = submission.oldPlaced || 0
        } else {
          group.cancellationSubmission = submission
          if (submission.newPlaced) group.totalNewPlaced = submission.newPlaced
          if (submission.oldPlaced) group.totalOldPlaced = submission.oldPlaced
          group.totalNewCancelled = submission.newCancelled || 0
          group.totalOldCancelled = submission.oldCancelled || 0
          group.hasPendingCancellation = true
        }
      })

    slotMap.forEach((group) => {
      if (group.cancellationSubmission) {
        group.totalNewSuccessful = group.totalNewPlaced - group.totalNewCancelled
        group.totalOldSuccessful = group.totalOldPlaced - group.totalOldCancelled
        const rates = group.cancellationSubmission.commissionRates
        console.log("[v0] Slot group commission rates:", rates)
        group.totalEarnings =
          group.totalNewSuccessful * rates.newPlaced +
          group.totalOldSuccessful * rates.oldPlaced +
          group.totalNewCancelled * rates.newCancelled +
          group.totalOldCancelled * rates.oldCancelled
      } else {
        group.hasPendingCancellation = true
        group.totalNewSuccessful = group.totalNewPlaced
        group.totalOldSuccessful = group.totalOldPlaced
        if (group.orderSubmission) {
          const rates = group.orderSubmission.commissionRates
          group.totalEarnings = group.totalNewPlaced * rates.newPlaced + group.totalOldPlaced * rates.oldPlaced
        }
      }
    })

    return Array.from(slotMap.values())
  }

  const handleApprove = async (slotGroup: SlotSubmissionGroup) => {
    if (!selectedEmployee) return

    setIsApproving(true)

    try {
      // Approve order submission
      if (slotGroup.orderSubmission && slotGroup.orderSubmission.status === "pending") {
        console.log("[v0] Approving order submission:", slotGroup.orderSubmission.id)
        const orderResponse = await fetch("/api/admin/approvals/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: slotGroup.orderSubmission.id,
            submissionType: "order",
          }),
        })

        if (!orderResponse.ok) {
          throw new Error("Failed to approve order submission")
        }
      }

      // Approve cancellation submission if it exists
      if (slotGroup.cancellationSubmission && slotGroup.cancellationSubmission.status === "pending") {
        console.log("[v0] Approving cancellation submission:", slotGroup.cancellationSubmission.id)
        const cancelResponse = await fetch("/api/admin/approvals/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: slotGroup.cancellationSubmission.id,
            submissionType: "cancellation",
          }),
        })

        if (!cancelResponse.ok) {
          throw new Error("Failed to approve cancellation submission")
        }
      }

      await fetchEmployeesWithPendingSubmissions()

      toast({
        title: "Submission Approved",
        description: `${slotGroup.slotName} for ${selectedEmployee?.fullName} has been approved.`,
      })

      setSelectedEmployee(null)
      setSelectedSlotGroup(null) // Clear selected slot group after approval
    } catch (error: any) {
      console.error("[v0] Error approving submission:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to approve submission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!selectedSlotGroup || !selectedEmployee || !rejectionReason.trim()) return

    setIsRejecting(true)

    try {
      // Reject order submission
      if (selectedSlotGroup.orderSubmission && selectedSlotGroup.orderSubmission.status === "pending") {
        console.log("[v0] Rejecting order submission:", selectedSlotGroup.orderSubmission.id)
        const orderResponse = await fetch("/api/admin/approvals/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: selectedSlotGroup.orderSubmission.id,
            submissionType: "order",
            reason: rejectionReason,
          }),
        })

        if (!orderResponse.ok) {
          throw new Error("Failed to reject order submission")
        }
      }

      // Reject cancellation submission if it exists
      if (selectedSlotGroup.cancellationSubmission && selectedSlotGroup.cancellationSubmission.status === "pending") {
        console.log("[v0] Rejecting cancellation submission:", selectedSlotGroup.cancellationSubmission.id)
        const cancelResponse = await fetch("/api/admin/approvals/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: selectedSlotGroup.cancellationSubmission.id,
            submissionType: "cancellation",
            reason: rejectionReason,
          }),
        })

        if (!cancelResponse.ok) {
          throw new Error("Failed to reject cancellation submission")
        }
      }

      await fetchEmployeesWithPendingSubmissions()

      toast({
        title: "Submission Rejected",
        description: `${selectedSlotGroup.slotName} has been rejected.`,
        variant: "destructive",
      })

      setShowRejectDialog(false)
      setSelectedSlotGroup(null)
      setSelectedEmployee(null)
      setRejectionReason("")
    } catch (error: any) {
      console.error("[v0] Error rejecting submission:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reject submission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  const handlePenalty = async () => {
    if (!penaltySlotGroup || !selectedEmployee || !penaltySlotGroup.orderSubmission) return

    setIsPenaltyApplying(true)

    try {
      console.log("[v0] Applying penalty for order submission:", penaltySlotGroup.orderSubmission.id)
      const response = await fetch("/api/admin/approvals/penalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderSubmissionId: penaltySlotGroup.orderSubmission.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to apply penalty")
      }

      const result = await response.json()
      console.log("[v0] Penalty applied successfully:", result)

      await fetchEmployeesWithPendingSubmissions()

      toast({
        title: "Penalty Applied",
        description: `${result.slotName} for ${result.employeeName} has been approved with penalty. Total commission: ₹${result.calculation.totalCommission}`,
        variant: "destructive",
      })

      setShowPenaltyDialog(false)
      setPenaltySlotGroup(null)
      setPenaltyCalculation(null)
      setSelectedEmployee(null)
      setSelectedSlotGroup(null)
    } catch (error: any) {
      console.error("[v0] Error applying penalty:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to apply penalty. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPenaltyApplying(false)
    }
  }

  const openPenaltyDialog = (slotGroup: SlotSubmissionGroup) => {
    if (!slotGroup.orderSubmission) {
      toast({
        title: "Error",
        description: "No order submission found for this slot",
        variant: "destructive",
      })
      return
    }

    // Calculate penalty amounts for display
    const newRate = slotGroup.orderSubmission.commissionRates.newCancelled
    const oldRate = slotGroup.orderSubmission.commissionRates.oldCancelled
    const newAmount = slotGroup.totalNewPlaced * newRate
    const oldAmount = slotGroup.totalOldPlaced * oldRate
    const total = newAmount + oldAmount

    setPenaltyCalculation({
      newIds: slotGroup.totalNewPlaced,
      oldIds: slotGroup.totalOldPlaced,
      newRate,
      oldRate,
      newAmount,
      oldAmount,
      total,
    })

    setPenaltySlotGroup(slotGroup)
    setShowPenaltyDialog(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const employeesWithPending = employees.filter((emp) => {
    const currentPartPending = emp.submissions.filter(
      (s) => s.status === "pending" && isInSelectedMonthPart(s.submittedAt, new Date(selectedMonth)),
    )
    return currentPartPending.length > 0
  })

  const totalPending = employeesWithPending.reduce(
    (sum, emp) =>
      sum +
      emp.submissions.filter(
        (s) => s.status === "pending" && isInSelectedMonthPart(s.submittedAt, new Date(selectedMonth)),
      ).length,
    0,
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          currentMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Order Approvals</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Review and approve employee submitted orders and cancellations
                    {(() => {
                      const selectedDate = new Date(selectedMonth)
                      const part = getMonthPart(selectedDate)
                      const range = getMonthPartRange(part)
                      return ` (${selectedDate.toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })} Part ${part}: ${range.start}-${range.end})`
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-orange-600">{totalPending}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200 mb-6" />

            {/* Employee Cards Grid */}
            {employeesWithPending.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending approvals for this period.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employeesWithPending.map((employee, index) => {
                  const pendingSlots = getSlotSubmissionGroups(employee)
                  const currentPartPending = pendingSlots.length

                  return (
                    <div
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee)}
                      className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer group relative"
                      style={{
                        animation: "slideInUp 0.6s ease-out",
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      {/* Pending Badge */}
                      <div className="absolute -top-3 -right-3 bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-white text-sm shadow-lg z-10">
                        {currentPartPending}
                      </div>

                      {/* Profile Section */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                          {employee.fullName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {employee.fullName}
                          </h3>
                          <p className="text-sm text-gray-600">@{employee.username}</p>
                        </div>
                      </div>

                      <div className="h-px bg-gray-200 mb-4" />

                      {/* Stats */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Pending Submissions</span>
                          <span className="font-bold text-orange-600">{currentPartPending}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Earnings</span>
                          <span className="font-bold text-green-600">
                            ₹{pendingSlots.reduce((sum, slot) => sum + slot.totalEarnings, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button className="w-full mt-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all group-hover:shadow-md">
                        Review Submissions →
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Employee Submissions Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedEmployee?.fullName}'s Submissions
              <p className="text-sm text-gray-600 font-normal mt-1">
                {(() => {
                  const pendingSlots = selectedEmployee ? getSlotSubmissionGroups(selectedEmployee) : []
                  const count = pendingSlots.length
                  return `${count} pending slot${count !== 1 ? "s" : ""}`
                })()}
              </p>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedEmployee &&
              getSlotSubmissionGroups(selectedEmployee).map((slotGroup, index) => (
                <div
                  key={slotGroup.slotId}
                  className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer"
                  onClick={() => setSelectedSlotGroup(slotGroup)}
                >
                  {/* Slot Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{slotGroup.slotName}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(slotGroup.slotDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {slotGroup.hasPendingCancellation &&
                      slotGroup.totalNewCancelled === 0 &&
                      slotGroup.totalOldCancelled === 0 && (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 border">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Cancellations Pending
                        </Badge>
                      )}
                  </div>

                  {slotGroup.orderSubmission?.status === "approved" &&
                    (!slotGroup.cancellationSubmission || slotGroup.cancellationSubmission.status === "approved") && (
                      <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-bold text-green-700">✓ Approved</span>
                      </div>
                    )}

                  {/* Order Summary */}
                  <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                    <h5 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Order Summary
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {slotGroup.totalNewPlaced > 0 && (
                        <div>
                          <p className="text-xs text-gray-600">New IDs Placed</p>
                          <p className="text-lg font-bold text-gray-900">{slotGroup.totalNewPlaced}</p>
                        </div>
                      )}
                      {slotGroup.totalOldPlaced > 0 && (
                        <div>
                          <p className="text-xs text-gray-600">Old IDs Placed</p>
                          <p className="text-lg font-bold text-gray-900">{slotGroup.totalOldPlaced}</p>
                        </div>
                      )}
                      {slotGroup.totalNewCancelled > 0 && (
                        <div>
                          <p className="text-xs text-gray-600">New IDs Cancelled</p>
                          <p className="text-lg font-bold text-red-600">{slotGroup.totalNewCancelled}</p>
                        </div>
                      )}
                      {slotGroup.totalOldCancelled > 0 && (
                        <div>
                          <p className="text-xs text-gray-600">Old IDs Cancelled</p>
                          <p className="text-lg font-bold text-red-600">{slotGroup.totalOldCancelled}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pincode Details Table */}
                  {(slotGroup.orderSubmission?.pincodes || slotGroup.cancellationSubmission?.pincodes) && (
                    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                      <h5 className="text-sm font-bold text-gray-700 mb-3">Pincode Details</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              <th className="text-left py-2 font-bold text-gray-600 text-xs uppercase">Pincode</th>
                              <th className="text-left py-2 font-bold text-gray-600 text-xs uppercase">Type</th>
                              <th className="text-right py-2 font-bold text-gray-600 text-xs uppercase">Placed</th>
                              <th className="text-right py-2 font-bold text-gray-600 text-xs uppercase">Cancelled</th>
                              <th className="text-right py-2 font-bold text-gray-600 text-xs uppercase">Success</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(
                              slotGroup.cancellationSubmission?.pincodes ||
                              slotGroup.orderSubmission?.pincodes ||
                              []
                            ).map((pc, idx) => {
                              const successCount = pc.placed - pc.cancelled
                              return (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-2 text-gray-900 font-medium">{pc.pincode}</td>
                                  <td className="py-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        pc.type === "new" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                      }`}
                                    >
                                      {pc.type === "new" ? "New" : "Old"}
                                    </span>
                                  </td>
                                  <td className="text-right py-2 text-gray-900 font-medium">{pc.placed}</td>
                                  <td className="text-right py-2 text-red-600 font-medium">{pc.cancelled}</td>
                                  <td className="text-right py-2 text-green-600 font-bold">{successCount}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Earnings Calculation */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                    <h5 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Earnings Calculation (Slot Commission Rates at Time of Submission)
                    </h5>

                    {slotGroup.orderSubmission &&
                      slotGroup.totalNewCancelled === 0 &&
                      slotGroup.totalOldCancelled === 0 && (
                        <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-3">
                          <p className="text-sm text-yellow-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              Cancellation updates are pending. Final earnings will be calculated once cancellations are
                              submitted.
                            </span>
                          </p>
                        </div>
                      )}

                    <div className="space-y-2 text-sm">
                      {/* Successfully Placed Orders */}
                      {slotGroup.totalNewSuccessful > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">
                            {slotGroup.totalNewSuccessful} New IDs (Placed - Cancelled) × ₹
                            {slotGroup.cancellationSubmission?.commissionRates.newPlaced ||
                              slotGroup.orderSubmission?.commissionRates.newPlaced ||
                              0}
                          </span>
                          <span className="font-bold text-gray-900">
                            ₹
                            {(
                              slotGroup.totalNewSuccessful *
                              (slotGroup.cancellationSubmission?.commissionRates.newPlaced ||
                                slotGroup.orderSubmission?.commissionRates.newPlaced ||
                                0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {slotGroup.totalOldSuccessful > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">
                            {slotGroup.totalOldSuccessful} Old IDs (Placed - Cancelled) × ₹
                            {slotGroup.cancellationSubmission?.commissionRates.oldPlaced ||
                              slotGroup.orderSubmission?.commissionRates.oldPlaced ||
                              0}
                          </span>
                          <span className="font-bold text-gray-900">
                            ₹
                            {(
                              slotGroup.totalOldSuccessful *
                              (slotGroup.cancellationSubmission?.commissionRates.oldPlaced ||
                                slotGroup.orderSubmission?.commissionRates.oldPlaced ||
                                0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {slotGroup.totalNewCancelled > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>
                            {slotGroup.totalNewCancelled} New IDs Cancelled × ₹
                            {slotGroup.cancellationSubmission?.commissionRates.newCancelled ||
                              slotGroup.orderSubmission?.commissionRates.newCancelled ||
                              0}
                          </span>
                          <span className="font-bold">
                            ₹
                            {(
                              slotGroup.totalNewCancelled *
                              (slotGroup.cancellationSubmission?.commissionRates.newCancelled ||
                                slotGroup.orderSubmission?.commissionRates.newCancelled ||
                                0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {slotGroup.totalOldCancelled > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>
                            {slotGroup.totalOldCancelled} Old IDs Cancelled × ₹
                            {slotGroup.cancellationSubmission?.commissionRates.oldCancelled ||
                              slotGroup.orderSubmission?.commissionRates.oldCancelled ||
                              0}
                          </span>
                          <span className="font-bold">
                            ₹
                            {(
                              slotGroup.totalOldCancelled *
                              (slotGroup.cancellationSubmission?.commissionRates.oldCancelled ||
                                slotGroup.orderSubmission?.commissionRates.oldCancelled ||
                                0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="h-px bg-green-300 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-green-800">Total Earnings:</span>
                        <span
                          className={`text-2xl font-bold ${
                            slotGroup.totalNewCancelled === 0 && slotGroup.totalOldCancelled === 0
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          ₹{(() => {
                            const rates = slotGroup.cancellationSubmission?.commissionRates ||
                              slotGroup.orderSubmission?.commissionRates || {
                                newPlaced: 0,
                                oldPlaced: 0,
                                newCancelled: 0,
                                oldCancelled: 0,
                              }
                            let total = 0
                            total += slotGroup.totalNewSuccessful * rates.newPlaced
                            total += slotGroup.totalOldSuccessful * rates.oldPlaced
                            total += slotGroup.totalNewCancelled * rates.newCancelled
                            total += slotGroup.totalOldCancelled * rates.oldCancelled
                            return total.toLocaleString()
                          })()}
                          {slotGroup.totalNewCancelled === 0 && slotGroup.totalOldCancelled === 0 && "*"}
                        </span>
                      </div>
                      {slotGroup.totalNewCancelled === 0 && slotGroup.totalOldCancelled === 0 && (
                        <p className="text-xs text-yellow-700 mt-2">
                          * Provisional earnings. Final amount will be calculated once cancellation updates are
                          submitted and approved.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {slotGroup.orderSubmission?.status === "approved" &&
                  (!slotGroup.cancellationSubmission || slotGroup.cancellationSubmission.status === "approved") ? (
                    <button
                      disabled
                      className="w-full mt-4 py-3 bg-green-600 text-white text-sm font-bold rounded-lg cursor-default flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />✓ Approved
                    </button>
                  ) : (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApprove(slotGroup)
                        }}
                        disabled={isApproving}
                        className="flex-1 py-3 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {isApproving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>
                      {/* Added Penalty button alongside Approve and Reject */}
                      {slotGroup.orderSubmission &&
                        slotGroup.hasPendingCancellation &&
                        slotGroup.totalNewCancelled === 0 &&
                        slotGroup.totalOldCancelled === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openPenaltyDialog(slotGroup)
                            }}
                            className="flex-1 py-3 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Penalty
                          </button>
                        )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSlotGroup(slotGroup)
                          setShowRejectDialog(true)
                        }}
                        className="flex-1 py-3 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Reject Submission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to reject this submission? Please provide a reason for rejection.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionReason("")
                setSelectedSlotGroup(null)
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isRejecting}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isRejecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPenaltyDialog} onOpenChange={setShowPenaltyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-5 h-5" />
              Apply Penalty - No Cancellation Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
              <p className="text-sm text-orange-800 font-medium mb-2">
                The employee did not submit cancellation updates before the deadline. By applying this penalty:
              </p>
              <ul className="text-sm text-orange-800 list-disc list-inside space-y-1">
                <li>All placed orders will be treated as cancelled</li>
                <li>Commission will be calculated using only the cancelled order rate</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            {penaltyCalculation && (
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <h5 className="text-sm font-bold text-gray-700 mb-3">Penalty Calculation</h5>
                <div className="space-y-2 text-sm">
                  {penaltyCalculation.newIds > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        {penaltyCalculation.newIds} New IDs (All Cancelled) × ₹{penaltyCalculation.newRate}
                      </span>
                      <span className="font-bold text-red-600">₹{penaltyCalculation.newAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {penaltyCalculation.oldIds > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        {penaltyCalculation.oldIds} Old IDs (All Cancelled) × ₹{penaltyCalculation.oldRate}
                      </span>
                      <span className="font-bold text-red-600">₹{penaltyCalculation.oldAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-300 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total Earnings:</span>
                    <span className="text-2xl font-bold text-red-600">
                      ₹{penaltyCalculation.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
              <p className="text-sm text-yellow-800">
                This will approve the order submission and update the commission records with the penalty calculation.
                The employee will see this penalty reflected in their dashboard.
              </p>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setShowPenaltyDialog(false)
                setPenaltySlotGroup(null)
                setPenaltyCalculation(null)
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handlePenalty}
              disabled={isPenaltyApplying}
              className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isPenaltyApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Applying Penalty...
                </>
              ) : (
                "Confirm Penalty"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
