"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  IndianRupee,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import React from "react" // Added React import for React.Fragment
import { getAllSlots, createSlot, updateSlot, deleteSlot } from "@/lib/graphql/admin-queries"
import { convertISTToUTC, utcToISTDate, formatUTCDateToIST, getTimeStringIST } from "@/lib/date-utils"

// Native date formatting functions to replace date-fns
const formatDate = (date: Date, formatStr: string): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthsFull = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const day = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()
  const dayOfWeek = date.getDay()
  const hours = date.getHours()
  const minutes = date.getMinutes()

  // Format time
  const hours12 = hours % 12 || 12
  const ampm = hours >= 12 ? "PM" : "AM"
  const minutesStr = minutes.toString().padStart(2, "0")
  const hoursStr = hours.toString().padStart(2, "0")

  switch (formatStr) {
    case "PPP": // e.g., "November 6, 2025"
      return `${monthsFull[month]} ${day}, ${year}`
    case "EEEE, d MMM yyyy": // e.g., "Thursday, 6 Nov 2025"
      return `${days[dayOfWeek]}, ${day} ${months[month]} ${year}`
    case "d MMM yyyy, h:mm a": // e.g., "6 Nov 2025, 11:00 AM"
      return `${day} ${months[month]} ${year}, ${hours12}:${minutesStr} ${ampm}`
    case "HH:mm": // e.g., "11:00"
      return `${hoursStr}:${minutesStr}`
    case "d MMM": // e.g., "6 Nov"
      return `${day} ${months[month]}`
    case "d MMM yyyy": // e.g., "6 Nov 2025"
      return `${day} ${months[month]} ${year}`
    default:
      return date.toLocaleDateString()
  }
}

interface Slot {
  id: string
  name: string
  date: Date
  orderDeadline: string // Store as string (UTC ISO timestamp)
  cancellationDeadline: string // Store as string (UTC ISO timestamp)
  commissionRates: {
    newPlaced: number
    newCancelled: number
    oldPlaced: number
    oldCancelled: number
  }
  notes?: string
  status: "past" | "active" | "upcoming"
  totalOrdersSubmitted?: number // Added field for real order count
}

export default function AdminSlotsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  )

  const [currentPart, setCurrentPart] = useState<1 | 2 | 3>(1)

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  // Form states
  const [slotName, setSlotName] = useState("")
  const [slotDate, setSlotDate] = useState<Date>()
  const [orderDeadline, setOrderDeadline] = useState<Date>()
  const [orderDeadlineTime, setOrderDeadlineTime] = useState("11:00")
  const [cancellationDeadline, setCancellationDeadline] = useState<Date>()
  const [cancellationDeadlineTime, setCancellationDeadlineTime] = useState("18:00")
  const [newPlacedRate, setNewPlacedRate] = useState("15")
  const [newCancelledRate, setNewCancelledRate] = useState("7")
  const [oldPlacedRate, setOldPlacedRate] = useState("15")
  const [oldCancelledRate, setOldCancelledRate] = useState("7")
  const [slotNotes, setSlotNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirmation
  const [deleteConfirmName, setDeleteConfirmName] = useState("")

  // State for expanded rows in the table
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Mock slots data
  const [slots, setSlots] = useState<Slot[]>([
    {
      id: "1",
      name: "4 Nov Slot",
      date: new Date(2025, 10, 4),
      orderDeadline: new Date(2025, 10, 4, 11, 0).toISOString(),
      cancellationDeadline: new Date(2025, 10, 4, 18, 0).toISOString(),
      commissionRates: { newPlaced: 15, newCancelled: 7, oldPlaced: 15, oldCancelled: 7 },
      status: "past",
      totalOrdersSubmitted: 150, // Mock data
    },
    {
      id: "2",
      name: "5 Nov Slot",
      date: new Date(2025, 10, 5),
      orderDeadline: new Date(2025, 10, 5, 11, 0).toISOString(),
      cancellationDeadline: new Date(2025, 10, 5, 18, 0).toISOString(),
      commissionRates: { newPlaced: 15, newCancelled: 7, oldPlaced: 15, oldCancelled: 7 },
      status: "past",
      totalOrdersSubmitted: 200, // Mock data
    },
    {
      id: "3",
      name: "6 Nov Slot",
      date: new Date(2025, 10, 6),
      orderDeadline: new Date(2025, 10, 6, 11, 0).toISOString(),
      cancellationDeadline: new Date(2025, 10, 6, 18, 0).toISOString(),
      commissionRates: { newPlaced: 15, newCancelled: 7, oldPlaced: 15, oldCancelled: 7 },
      notes: "Important: Double-check all orders before submission",
      status: "active",
      totalOrdersSubmitted: 180, // Mock data
    },
    {
      id: "4",
      name: "7 Nov Slot",
      date: new Date(2025, 10, 7),
      orderDeadline: new Date(2025, 10, 7, 11, 0).toISOString(),
      cancellationDeadline: new Date(2025, 10, 7, 18, 0).toISOString(),
      commissionRates: { newPlaced: 15, newCancelled: 7, oldPlaced: 15, oldCancelled: 7 },
      status: "upcoming",
      totalOrdersSubmitted: 0, // Mock data
    },
  ])

  useEffect(() => {
    const authToken = localStorage.getItem("admin_auth_token")
    if (!authToken) {
      router.push("/login")
      return
    }

    const loadSlots = async () => {
      try {
        const { data, error } = await getAllSlots()

        if (error) {
          console.error("Error fetching slots:", error)
          toast({
            title: "Error",
            description: "Failed to load slots",
            variant: "destructive",
          })
          return
        }

        // console.log("[v0] Server time:", data.serverTime) // Removed console logs
        const formattedSlots = data.slots.map((slot: any) => {
          // console.log("[v0] Slot:", slot.name, "Server computed status:", slot.computedStatus) // Removed console logs

          return {
            id: slot.id,
            name: slot.name,
            date: utcToISTDate(slot.slot_date),
            // Store UTC timestamps as strings for accurate display
            orderDeadline: slot.order_submission_deadline,
            cancellationDeadline: slot.cancellation_submission_deadline,
            commissionRates: {
              newPlaced: slot.new_id_success_commission,
              newCancelled: slot.new_id_cancelled_commission,
              oldPlaced: slot.old_id_success_commission,
              oldCancelled: slot.old_id_cancelled_commission,
            },
            status: slot.computedStatus || slot.status,
            totalOrdersSubmitted: slot.totalOrdersSubmitted || 0, // Added real order count from API
          }
        })

        setSlots(formattedSlots)
      } catch (err) {
        console.error("Slots fetch error:", err)
      }
    }

    loadSlots()
    setIsLoading(false)
  }, [router, toast])

  // const pastSlots = slots.filter((s) => s.status === "past") // Removed to avoid redeclaration
  // const activeSlots = slots.filter((s) => s.status === "active" || s.status === "upcoming") // Removed to avoid redeclaration

  const resetForm = () => {
    setSlotName("")
    setSlotDate(undefined)
    setOrderDeadline(undefined)
    setOrderDeadlineTime("11:00")
    setCancellationDeadline(undefined)
    setCancellationDeadlineTime("18:00")
    setNewPlacedRate("15")
    setNewCancelledRate("7")
    setOldPlacedRate("15")
    setOldCancelledRate("7")
    setSlotNotes("")
  }

  const handleCreateSlot = () => {
    resetForm()
    setCreateModalOpen(true)
  }

  const openEditDialog = (slot: Slot) => {
    setSelectedSlot(slot)
    setSlotName(slot.name)
    setSlotDate(slot.date)
    setOrderDeadline(slot.date)
    setOrderDeadlineTime(getTimeStringIST(slot.orderDeadline))
    setCancellationDeadline(slot.date)
    setCancellationDeadlineTime(getTimeStringIST(slot.cancellationDeadline))
    setNewPlacedRate(slot.commissionRates.newPlaced.toString())
    setNewCancelledRate(slot.commissionRates.newCancelled.toString())
    setOldPlacedRate(slot.commissionRates.oldPlaced.toString())
    setOldCancelledRate(slot.commissionRates.oldCancelled.toString())
    setSlotNotes(slot.notes || "")
    setEditModalOpen(true)
  }

  const handleDeleteSlot = (slotId: string) => {
    setSlots(slots.filter((s) => s.id !== slotId))
    toast({ title: "Success", description: "Slot deleted successfully!" })
  }

  const validateForm = () => {
    // console.log("[v0] Validating slot form:", { // Removed console logs
    //   slotName,
    //   slotDate,
    //   orderDeadline,
    //   cancellationDeadline,
    // })

    if (!slotName.trim()) {
      // console.log("[v0] Validation failed: Slot name is required") // Removed console logs
      toast({ title: "Error", description: "Slot name is required", variant: "destructive" })
      return false
    }
    if (!slotDate) {
      // console.log("[v0] Validation failed: Slot date is required") // Removed console logs
      toast({ title: "Error", description: "Slot date is required", variant: "destructive" })
      return false
    }
    if (!orderDeadline) {
      // console.log("[v0] Validation failed: Order deadline is required") // Removed console logs
      toast({ title: "Error", description: "Order deadline is required", variant: "destructive" })
      return false
    }
    if (!cancellationDeadline) {
      // console.log("[v0] Validation failed: Cancellation deadline is required") // Removed console logs
      toast({ title: "Error", description: "Cancellation deadline is required", variant: "destructive" })
      return false
    }

    // Combine date and time for proper validation
    const combinedOrderDeadline = new Date(orderDeadline)
    const [orderHours, orderMinutes] = orderDeadlineTime.split(":").map(Number)
    combinedOrderDeadline.setHours(orderHours, orderMinutes, 0, 0)

    const combinedCancellationDeadline = new Date(cancellationDeadline)
    const [cancelHours, cancelMinutes] = cancellationDeadlineTime.split(":").map(Number)
    combinedCancellationDeadline.setHours(cancelHours, cancelMinutes, 0, 0)

    // console.log("[v0] Combined deadlines:", { // Removed console logs
    //   orderDeadline: combinedOrderDeadline.toISOString(),
    //   cancellationDeadline: combinedCancellationDeadline.toISOString(),
    // })

    if (combinedCancellationDeadline < combinedOrderDeadline) {
      // console.log("[v0] Validation failed: Cancellation deadline cannot be before order deadline") // Removed console logs
      toast({
        title: "Invalid Deadlines",
        description: "Cancellation deadline cannot be before order deadline. Please check the dates and times.",
        variant: "destructive",
      })
      return false
    }

    // console.log("[v0] Validation passed") // Removed console logs
    return true
  }

  const handleSaveSlot = async () => {
    // console.log("[v0] Create Slot button clicked") // Removed console logs
    if (!validateForm()) return

    const formatDateForDB = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    // Convert IST times to UTC
    const utcOrderDeadline = convertISTToUTC(orderDeadline!, orderDeadlineTime)
    const utcCancellationDeadline = convertISTToUTC(cancellationDeadline!, cancellationDeadlineTime)

    setIsSaving(true)

    try {
      const slotData = {
        name: slotName,
        slot_date: formatDateForDB(slotDate!),
        order_submission_deadline: utcOrderDeadline,
        cancellation_submission_deadline: utcCancellationDeadline,
        new_id_success_commission: Number.parseFloat(newPlacedRate),
        old_id_success_commission: Number.parseFloat(oldPlacedRate),
        new_id_cancelled_commission: Number.parseFloat(newCancelledRate),
        old_id_cancelled_commission: Number.parseFloat(oldCancelledRate),
        status: "active",
      }

      // console.log("[v0] Slot data to be saved (UTC):", slotData) // Removed console logs

      if (editModalOpen && selectedSlot) {
        const { error } = await updateSlot(selectedSlot.id, slotData)

        if (error) {
          toast({
            title: "Error",
            description: error.includes("already exists") ? error : "Failed to update slot",
            variant: "destructive",
          })
          setIsSaving(false)
          return
        }

        const [orderHours, orderMinutes] = orderDeadlineTime.split(":").map(Number)
        const [cancelHours, cancelMinutes] = cancellationDeadlineTime.split(":").map(Number)

        const orderDeadlineIST = new Date(orderDeadline!)
        orderDeadlineIST.setHours(orderHours, orderMinutes, 0, 0)

        const cancellationDeadlineIST = new Date(cancellationDeadline!)
        cancellationDeadlineIST.setHours(cancelHours, cancelMinutes, 0, 0)

        const updatedSlot = {
          id: selectedSlot.id,
          name: slotName,
          date: slotDate!,
          orderDeadline: utcOrderDeadline, // Use the UTC string
          cancellationDeadline: utcCancellationDeadline, // Use the UTC string
          commissionRates: {
            newPlaced: Number.parseFloat(newPlacedRate),
            newCancelled: Number.parseFloat(newCancelledRate),
            oldPlaced: Number.parseFloat(oldPlacedRate),
            oldCancelled: Number.parseFloat(oldCancelledRate),
          },
          notes: slotNotes.trim() || undefined,
          status: "active", // Assuming status is updated to active for edits
          totalOrdersSubmitted: selectedSlot.totalOrdersSubmitted, // Keep existing count for edits
        }

        setSlots(slots.map((s) => (s.id === selectedSlot.id ? updatedSlot : s)))
        toast({ title: "Success", description: "Slot updated successfully!" })
        setEditModalOpen(false)
      } else {
        // @ts-ignore
        const { data, error } = await createSlot(slotData)

        if (error) {
          toast({
            title: "Error",
            description: error.includes("already exists") ? error : "Failed to create slot",
            variant: "destructive",
          })
          setIsSaving(false)
          return
        }

        const [orderHours, orderMinutes] = orderDeadlineTime.split(":").map(Number)
        const [cancelHours, cancelMinutes] = cancellationDeadlineTime.split(":").map(Number)

        const orderDeadlineIST = new Date(orderDeadline!)
        orderDeadlineIST.setHours(orderHours, orderMinutes, 0, 0)

        const cancellationDeadlineIST = new Date(cancellationDeadline!)
        cancellationDeadlineIST.setHours(cancelHours, cancelMinutes, 0, 0)

        const createdSlot: Slot = {
          id: data.insert_slots_one.id,
          name: slotName,
          date: slotDate!,
          orderDeadline: utcOrderDeadline, // Use the UTC string
          cancellationDeadline: utcCancellationDeadline, // Use the UTC string
          commissionRates: {
            newPlaced: Number.parseFloat(newPlacedRate),
            newCancelled: Number.parseFloat(newCancelledRate),
            oldPlaced: Number.parseFloat(oldPlacedRate),
            oldCancelled: Number.parseFloat(oldCancelledRate),
          },
          notes: slotNotes.trim() || undefined,
          status: "upcoming", // Default status for new slots
          totalOrdersSubmitted: 0, // New slots have 0 orders initially
        }

        setSlots([...slots, createdSlot])
        toast({ title: "Success", description: "Slot created successfully!" })
        setCreateModalOpen(false)
      }
    } catch (err) {
      console.error("Save slot error:", err)
      toast({
        title: "Error",
        description: "Failed to save slot",
        variant: "destructive",
      })
    }

    setIsSaving(false)
    resetForm()
  }

  const confirmDelete = async () => {
    if (!selectedSlot) return
    if (deleteConfirmName !== selectedSlot.name) {
      toast({ title: "Error", description: "Slot name doesn't match", variant: "destructive" })
      return
    }

    setIsSaving(true)

    try {
      const { error } = await deleteSlot(selectedSlot.id)

      if (error) {
        throw new Error(error)
      }

      // Update local state to remove deleted slot
      setSlots(slots.filter((s) => s.id !== selectedSlot.id))

      toast({
        title: "Success",
        description: "Slot deleted successfully!",
      })

      setDeleteModalOpen(false)
      setSelectedSlot(null)
      setDeleteConfirmName("")
    } catch (err) {
      console.error("Delete slot error:", err)
      toast({
        title: "Error",
        description: "Failed to delete slot",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getMonthPartRange = (part: number) => {
    const date = new Date(selectedMonth)
    const start = new Date(date.getFullYear(), date.getMonth(), part)
    const end = new Date(date.getFullYear(), date.getMonth(), part + 4)
    return { start, end }
  }

  const monthShort = formatDate(new Date(selectedMonth), "MMM")

  const getPeriodRange = (part: 1 | 2 | 3) => {
    const date = new Date(selectedMonth)
    const year = date.getFullYear()
    const month = date.getMonth()

    if (part === 1) {
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month, 10, 23, 59, 59),
      }
    } else if (part === 2) {
      return {
        start: new Date(year, month, 11),
        end: new Date(year, month, 20, 23, 59, 59),
      }
    } else {
      return {
        start: new Date(year, month, 21),
        end: new Date(year, month + 1, 0, 23, 59, 59), // Last day of month
      }
    }
  }

  const filterSlotsByPeriod = (slotsList: Slot[]) => {
    const range = getPeriodRange(currentPart)
    return slotsList.filter((slot) => {
      const slotDate = new Date(slot.date)
      return slotDate >= range.start && slotDate <= range.end
    })
  }

  const filteredSlots = filterSlotsByPeriod(slots)
  const currentPastSlots = filteredSlots.filter((s) => s.status === "past") // Renamed from pastSlots
  const currentActiveSlots = filteredSlots.filter((s) => s.status === "active" || s.status === "upcoming") // Renamed from activeSlots

  // Function to toggle row expansion
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

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
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Slots Management</h2>
                <p className="text-sm text-gray-600 mt-1">Create and manage order slots for {selectedMonth}</p>
              </div>

              <Button onClick={handleCreateSlot} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Slot
              </Button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                variant={currentPart === 1 ? "default" : "outline"}
                onClick={() => setCurrentPart(1)}
                className={currentPart === 1 ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
              >
                Part 1 (1-10 {monthShort})
              </Button>
              <Button
                variant={currentPart === 2 ? "default" : "outline"}
                onClick={() => setCurrentPart(2)}
                className={currentPart === 2 ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
              >
                Part 2 (11-20 {monthShort})
              </Button>
              <Button
                variant={currentPart === 3 ? "default" : "outline"}
                onClick={() => setCurrentPart(3)}
                className={currentPart === 3 ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
              >
                Part 3 (21-
                {new Date(new Date(selectedMonth).getFullYear(), new Date(selectedMonth).getMonth() + 1, 0).getDate()}{" "}
                {monthShort})
              </Button>
            </div>

            <div className="border-b border-gray-200 mb-8" />

            {/* Past Slots Section */}
            {currentPastSlots.length > 0 && (
              <div className="mb-8">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">PAST SLOTS</h3>
                  <p className="text-sm text-gray-600">
                    Slots from {formatDate(getPeriodRange(currentPart).start, "d MMM")} -{" "}
                    {formatDate(getPeriodRange(currentPart).end, "d MMM")} {monthShort}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                            Slot Name
                          </th>
                          <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                            Date
                          </th>
                          <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                            Orders Submitted
                          </th>
                          <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPastSlots.map((slot) => (
                          <tr key={slot.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="font-semibold text-gray-700">{slot.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-600">{formatDate(slot.date, "EEEE, d MMM yyyy")}</td>
                            <td className="py-4 px-4 text-gray-600">{slot.totalOrdersSubmitted || 0} orders</td>
                            <td className="py-4 px-4">
                              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3 p-4">
                    {currentPastSlots.map((slot) => (
                      <div key={slot.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <h4 className="font-semibold text-gray-700">{slot.name}</h4>
                          </div>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                            Completed
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{formatDate(slot.date, "EEEE, d MMM yyyy")}</p>
                        <p className="text-xs text-gray-600">
                          Orders submitted: {slot.totalOrdersSubmitted || 0} orders
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active & Upcoming Slots Section */}
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">ACTIVE & UPCOMING SLOTS</h3>
                <p className="text-sm text-gray-600">Slots you can manage</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                          Slot Name
                        </th>
                        <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                          Date
                        </th>
                        <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                          Order Deadline
                        </th>
                        <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                          Cancel Deadline
                        </th>
                        <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                          Commission
                        </th>
                        <th className="text-left py-4 px-4 font-bold text-gray-600 uppercase tracking-wide text-xs">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentActiveSlots.map((slot) => {
                        const isExpanded = expandedRows.has(slot.id)
                        return (
                          <React.Fragment key={slot.id}>
                            <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-4">
                                <button
                                  onClick={() => toggleRow(slot.id)}
                                  className="text-blue-600 font-semibold hover:underline flex items-center gap-2"
                                >
                                  {slot.name}
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="py-4 px-4 text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(slot.date, "d MMM yyyy")}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-gray-600">
                                <div className="text-xs">
                                  <div className="font-semibold text-orange-700">
                                    {formatUTCDateToIST(slot.orderDeadline, "d MMM yyyy")}
                                  </div>
                                  <div className="text-orange-600">
                                    {formatUTCDateToIST(slot.orderDeadline, "HH:mm")}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-gray-600">
                                <div className="text-xs">
                                  <div className="font-semibold text-red-700">
                                    {formatUTCDateToIST(slot.cancellationDeadline, "d MMM yyyy")}
                                  </div>
                                  <div className="text-red-600">
                                    {formatUTCDateToIST(slot.cancellationDeadline, "HH:mm")}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                  Set
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditDialog(slot)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedSlot(slot)
                                      setDeleteModalOpen(true)
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Row */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="bg-blue-50 p-6">
                                  <div className="space-y-6">
                                    {/* Deadlines Detail */}
                                    <div>
                                      <h4 className="text-sm font-bold text-gray-900 mb-3">Deadline Details</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                                          <div className="flex items-start gap-3">
                                            <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs font-semibold text-orange-900 mb-1">
                                                Order Submission Deadline
                                              </p>
                                              <p className="text-sm font-bold text-orange-700">
                                                {formatUTCDateToIST(slot.orderDeadline, "d MMM yyyy, h:mm a")}
                                              </p>
                                              <p className="text-xs text-orange-600 mt-1">
                                                When employees can no longer submit orders
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border border-red-200">
                                          <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs font-semibold text-red-900 mb-1">
                                                Cancellation Submission Deadline
                                              </p>
                                              <p className="text-sm font-bold text-red-700">
                                                {formatUTCDateToIST(slot.cancellationDeadline, "d MMM yyyy, h:mm a")}
                                              </p>
                                              <p className="text-xs text-red-600 mt-1">
                                                When employees can no longer submit cancellations
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Commission Rates */}
                                    <div>
                                      <h4 className="text-sm font-bold text-gray-900 mb-3">Commission Rates</h4>
                                      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                              <th className="text-left py-2 px-3 font-semibold text-gray-600">Type</th>
                                              <th className="text-left py-2 px-3 font-semibold text-gray-600">
                                                Successfully Placed
                                              </th>
                                              <th className="text-left py-2 px-3 font-semibold text-gray-600">
                                                Cancelled
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr className="border-b border-gray-200">
                                              <td className="py-2 px-3 font-medium">New ID</td>
                                              <td className="py-2 px-3 text-green-700 font-semibold">
                                                ₹{slot.commissionRates.newPlaced} per order
                                              </td>
                                              <td className="py-2 px-3 text-orange-700 font-semibold">
                                                ₹{slot.commissionRates.newCancelled} per order
                                              </td>
                                            </tr>
                                            <tr>
                                              <td className="py-2 px-3 font-medium">Old ID</td>
                                              <td className="py-2 px-3 text-green-700 font-semibold">
                                                ₹{slot.commissionRates.oldPlaced} per order
                                              </td>
                                              <td className="py-2 px-3 text-orange-700 font-semibold">
                                                ₹{slot.commissionRates.oldCancelled} per order
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* Notes */}
                                    {slot.notes && (
                                      <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-2">Additional Notes</h4>
                                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                                          <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-yellow-800">{slot.notes}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                  {currentActiveSlots.map((slot) => {
                    const isExpanded = expandedRows.has(slot.id)
                    return (
                      <div key={slot.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{slot.name}</h3>
                            <p className="text-xs text-gray-600 mt-1">{formatDate(slot.date, "EEEE, d MMM yyyy")}</p>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                            Set
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Order Deadline:</span>
                            <span className="font-semibold text-orange-700">
                              {formatUTCDateToIST(slot.orderDeadline, "d MMM, HH:mm")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Cancel Deadline:</span>
                            <span className="font-semibold text-red-700">
                              {formatUTCDateToIST(slot.cancellationDeadline, "d MMM, HH:mm")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditDialog(slot)}
                            className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSlot(slot)
                              setDeleteModalOpen(true)
                            }}
                            className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>

                        <button
                          onClick={() => toggleRow(slot.id)}
                          className="w-full py-2 text-blue-600 text-sm font-medium border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {isExpanded ? "Hide Details" : "View Details"}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="pt-4 border-t border-gray-200 space-y-4">
                            {/* Deadlines Detail */}
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 mb-2">Deadline Details</h4>
                              <div className="space-y-2">
                                <div className="bg-orange-50 rounded-lg p-3 text-xs">
                                  <p className="font-semibold text-orange-900 mb-1">Order Submission Deadline</p>
                                  <p className="text-orange-700">
                                    {formatUTCDateToIST(slot.orderDeadline, "d MMM yyyy, h:mm a")}
                                  </p>
                                  <p className="text-orange-600 mt-1">When employees can no longer submit orders</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3 text-xs">
                                  <p className="font-semibold text-red-900 mb-1">Cancellation Submission Deadline</p>
                                  <p className="text-red-700">
                                    {formatUTCDateToIST(slot.cancellationDeadline, "d MMM yyyy, h:mm a")}
                                  </p>
                                  <p className="text-red-600 mt-1">When employees can no longer submit cancellations</p>
                                </div>
                              </div>
                            </div>

                            {/* Commission Rates */}
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 mb-2">Commission Rates</h4>
                              <div className="space-y-2 text-xs">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="font-semibold mb-1">New ID</p>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Placed:</span>
                                    <span className="text-green-700 font-semibold">
                                      ₹{slot.commissionRates.newPlaced}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Cancelled:</span>
                                    <span className="text-orange-700 font-semibold">
                                      ₹{slot.commissionRates.newCancelled}
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="font-semibold mb-1">Old ID</p>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Placed:</span>
                                    <span className="text-green-700 font-semibold">
                                      ₹{slot.commissionRates.oldPlaced}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Cancelled:</span>
                                    <span className="text-orange-700 font-semibold">
                                      ₹{slot.commissionRates.oldCancelled}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Notes */}
                            {slot.notes && (
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-2">Additional Notes</h4>
                                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                                  <p className="text-xs text-yellow-800">{slot.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create/Edit Slot Modal */}
      <Dialog
        open={createModalOpen || editModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false)
            setEditModalOpen(false)
            setSelectedSlot(null) // Clear selected slot when modal closes
            resetForm() // Reset form when modal closes
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editModalOpen ? "Edit Slot" : "Create New Slot"}</DialogTitle>
            <DialogDescription>
              {editModalOpen ? "Update slot configuration" : "Set up a new order slot"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Slot Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={slotName}
                    onChange={(e) => setSlotName(e.target.value)}
                    placeholder="e.g., 6 Nov Slot"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Name should include the date</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Slot Date <span className="text-red-500">*</span>
                  </label>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <Calendar className="mr-2 h-4 w-4" />
                        {slotDate ? formatDate(slotDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-white border border-gray-200 shadow-lg"
                      align="start"
                      side="bottom"
                      sideOffset={8}
                    >
                      <CalendarComponent mode="single" selected={slotDate} onSelect={setSlotDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* Deadlines */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wide">Deadlines</h3>
              <div className="space-y-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Order Submission Deadline <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Popover modal={true}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                          <Calendar className="mr-2 h-4 w-4 text-gray-600" />
                          {orderDeadline ? formatDate(orderDeadline, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-white border border-gray-200 shadow-lg"
                        align="start"
                        side="bottom"
                        sideOffset={8}
                      >
                        <CalendarComponent
                          mode="single"
                          selected={orderDeadline}
                          onSelect={setOrderDeadline}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={orderDeadlineTime}
                      onChange={(e) => setOrderDeadlineTime(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">When employees can no longer submit orders</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Cancellation Submission Deadline <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Popover modal={true}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                          <Calendar className="mr-2 h-4 w-4 text-gray-600" />
                          {cancellationDeadline ? formatDate(cancellationDeadline, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-white border border-gray-200 shadow-lg"
                        align="start"
                        side="bottom"
                        sideOffset={8}
                      >
                        <CalendarComponent
                          mode="single"
                          selected={cancellationDeadline}
                          onSelect={setCancellationDeadline}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={cancellationDeadlineTime}
                      onChange={(e) => setCancellationDeadlineTime(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">When employees can no longer submit cancellations</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* Commission Rates */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Set Commission Rates for this Slot
              </h3>
              <p className="text-xs text-gray-600 mb-4">Amount in ₹ per order</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">New ID - Successfully Placed</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="number"
                      value={newPlacedRate}
                      onChange={(e) => setNewPlacedRate(e.target.value)}
                      placeholder="15"
                      className="pl-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">per order</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">New ID - Cancelled</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="number"
                      value={newCancelledRate}
                      onChange={(e) => setNewCancelledRate(e.target.value)}
                      placeholder="7"
                      className="pl-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">per order</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Old ID - Successfully Placed</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="number"
                      value={oldPlacedRate}
                      onChange={(e) => setOldPlacedRate(e.target.value)}
                      placeholder="15"
                      className="pl-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">per order</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Old ID - Cancelled</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="number"
                      value={oldCancelledRate}
                      onChange={(e) => setOldCancelledRate(e.target.value)}
                      placeholder="7"
                      className="pl-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">per order</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-900">These rates will be shown to employees on slot selection</p>
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">Additional Notes (Optional)</label>
              <textarea
                value={slotNotes}
                onChange={(e) => setSlotNotes(e.target.value)}
                placeholder="Add any notes for employees (optional)"
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">Visible to employees on slot details</p>
                <p className="text-xs text-gray-500">{slotNotes.length}/500</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false)
                setEditModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSlot} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? "Saving..." : editModalOpen ? "Save Changes" : "Create Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open)
          if (!open) {
            // Clear state when modal is closed
            setSelectedSlot(null)
            setDeleteConfirmName("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-red-600">Delete Slot</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-600">
              Are you sure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">
              Deleting <span className="font-bold">'{selectedSlot?.name}'</span> will not affect existing orders.
            </p>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Type the slot name to confirm: <span className="font-mono text-blue-600">{selectedSlot?.name}</span>
              </label>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Type slot name here"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isSaving || deleteConfirmName !== selectedSlot?.name}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSaving ? "Deleting..." : "Delete Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.6;
          }
        }
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
