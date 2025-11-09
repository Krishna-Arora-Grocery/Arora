"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import DashboardHeader from "@/components/dashboard-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Lock, Eye, EyeOff, Phone, Shield, Clock, Edit2, Mail, Copy, FileSpreadsheet } from "lucide-react"

interface EmployeeData {
  id: string
  name: string
  email: string
  username: string
  telegram_username: string | null
  mobile_number: string | null
  total_ids_given: number
  instaddr_account_id: string | null
  instaddr_account_password: string | null
  instaddr_account_email: string | null
  upi_id: string | null
  excel_link: string | null // Added excel_link field
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("account")
  const [isModified, setIsModified] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState("")
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  // Password change state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)

  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const fetchEmployeeData = async (id: string) => {
    setDataLoading(true)
    setDataError(null)

    try {
      const response = await fetch(`/api/employee/profile?id=${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load profile")
      }

      if (data.employees_by_pk) {
        setEmployeeData(data.employees_by_pk)
      } else {
        setDataError("Employee not found")
      }
    } catch (error) {
      console.error("[v0] Error fetching employee:", error)
      setDataError(error instanceof Error ? error.message : "Failed to load profile")
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    const authToken = localStorage.getItem("auth_token")
    const storedEmployeeId = localStorage.getItem("employee_id")

    if (!authToken || !storedEmployeeId) {
      router.push("/")
      return
    }

    setEmployeeId(storedEmployeeId)
    setIsLoading(false)
    fetchEmployeeData(storedEmployeeId)
  }, [router])

  useEffect(() => {}, [dataLoading, dataError])

  // Password strength calculation
  useEffect(() => {
    let strength = 0
    if (newPassword.length >= 8) strength++
    if (/[A-Z]/.test(newPassword)) strength++
    if (/[a-z]/.test(newPassword)) strength++
    if (/[0-9]/.test(newPassword)) strength++
    if (/[!@#$%^&*]/.test(newPassword)) strength++
    setPasswordStrength(strength)
  }, [newPassword])

  const handleSave = async () => {
    if (!employeeData) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/employee/update-upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: employeeData.id,
          upiId: employeeData.upi_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update UPI ID")
      }

      setIsModified(false)
      const now = new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
      setLastSaved(now)

      toast({
        title: "UPI ID Updated!",
        description: "Your payment information has been saved successfully.",
      })

      // Refetch employee data
      if (employeeId) {
        await fetchEmployeeData(employeeId)
      }
    } catch (error) {
      console.error("[v0] Error updating employee:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update UPI ID. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (employeeId) {
      fetchEmployeeData(employeeId)
      setIsModified(false)
      toast({
        title: "Changes Discarded",
        description: "UPI ID changes have been reverted.",
      })
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (passwordStrength < 3) {
      toast({
        title: "Weak Password",
        description: "Please use a stronger password.",
        variant: "destructive",
      })
      return
    }

    if (!employeeData) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/employee/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: employeeData.id,
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password")
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Password Changed!",
        description: "Your password has been updated successfully.",
      })
    } catch (error) {
      console.error("[v0] Error updating password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    })
  }

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <p className="text-red-600 mb-4">Failed to load profile data</p>
          <p className="text-sm text-gray-600 mb-4">{dataError}</p>
          <Button onClick={() => employeeId && fetchEmployeeData(employeeId)}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!employeeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <p className="text-gray-600 mb-4">No employee data found</p>
          <Button onClick={() => router.push("/employee/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    )
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
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">My Profile</h1>
              <p className="text-sm text-[#6B7280] mt-1">View your account information and manage security settings</p>
            </div>

            <div className="h-px bg-[#E5E7EB] mb-6" />

            {/* Main Content Card */}
            <div className="bg-white rounded-[20px] shadow-lg overflow-hidden">
              {/* Profile Picture Section */}
              <div className="p-6 md:p-10 border-b border-[#E5E7EB]">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Left: Profile Picture */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {employeeData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  </div>

                  {/* Right: User Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#111827]">{employeeData.name}</h2>
                    <p className="text-sm text-[#6B7280] mt-1">{employeeData.email}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">@{employeeData.username}</p>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6">
                  <TabsList className="h-12 bg-transparent p-0 gap-1">
                    <TabsTrigger
                      value="account"
                      className="data-[state=active]:bg-white data-[state=active]:text-[#3B82F6] data-[state=active]:border-b-2 data-[state=active]:border-[#3B82F6] rounded-t-lg px-6"
                    >
                      Account Information
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="data-[state=active]:bg-white data-[state=active]:text-[#3B82F6] data-[state=active]:border-b-2 data-[state=active]:border-[#3B82F6] rounded-t-lg px-6"
                    >
                      Security Settings
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="account" className="p-6 md:p-10 space-y-8">
                  {/* Section 1: Basic Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide">Basic Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                          Full Name
                          <Lock className="w-3 h-3 text-[#9CA3AF]" />
                        </Label>
                        <Input
                          value={employeeData.name}
                          disabled
                          className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] cursor-not-allowed"
                        />
                        <p className="text-[10px] text-[#9CA3AF] mt-1">Set by admin</p>
                      </div>

                      {/* Email */}
                      <div>
                        <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                          Email
                          <Lock className="w-3 h-3 text-[#9CA3AF]" />
                        </Label>
                        <Input
                          value={employeeData.email}
                          disabled
                          className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] cursor-not-allowed"
                        />
                        <p className="text-[10px] text-[#9CA3AF] mt-1">Used for login</p>
                      </div>

                      {/* Username */}
                      <div>
                        <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                          Username
                          <Lock className="w-3 h-3 text-[#9CA3AF]" />
                        </Label>
                        <Input
                          value={employeeData.username}
                          disabled
                          className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] cursor-not-allowed"
                        />
                        <p className="text-[10px] text-[#9CA3AF] mt-1">Unique identifier</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Professional Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide">Professional Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mobile Number */}
                      {employeeData.mobile_number && (
                        <div>
                          <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            Mobile Number
                            <Lock className="w-3 h-3 text-[#9CA3AF]" />
                          </Label>
                          <Input
                            value={employeeData.mobile_number}
                            disabled
                            className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] cursor-not-allowed"
                          />
                        </div>
                      )}

                      {/* Total IDs Given */}
                      <div>
                        <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                          Total IDs Given
                          <Lock className="w-3 h-3 text-[#9CA3AF]" />
                        </Label>
                        <div className="h-9 px-3 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-md flex items-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#1E40AF]">
                            {employeeData.total_ids_given} IDs
                          </span>
                        </div>
                      </div>

                      {/* Telegram Username */}
                      {employeeData.telegram_username && (
                        <div>
                          <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                            Telegram Username
                            <Lock className="w-3 h-3 text-[#9CA3AF]" />
                          </Label>
                          <Input
                            value={employeeData.telegram_username}
                            disabled
                            className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] cursor-not-allowed"
                          />
                        </div>
                      )}

                      {/* Excel Link */}
                      {employeeData.excel_link && (
                        <div className="md:col-span-2">
                          <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                            <FileSpreadsheet className="w-3 h-3 text-[#10B981]" />
                            Excel Link (All IDs)
                            <Lock className="w-3 h-3 text-[#9CA3AF]" />
                          </Label>
                          <div className="relative">
                            <Input
                              value={employeeData.excel_link}
                              disabled
                              className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] cursor-not-allowed pr-10"
                            />
                            <button
                              onClick={() => handleCopy(employeeData.excel_link!)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[#E5E7EB] rounded transition-colors"
                              title="Copy link"
                            >
                              <Copy className="w-4 h-4 text-[#6B7280]" />
                            </button>
                          </div>
                          <p className="text-[10px] text-[#10B981] mt-1">📊 Click copy icon to copy the link</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instaddr Account Section */}
                  {(employeeData.instaddr_account_id ||
                    employeeData.instaddr_account_email ||
                    employeeData.instaddr_account_password) && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#3B82F6]" />
                        Instaddr Account
                      </h3>
                      <p className="text-xs text-[#6B7280]">Email inbox service credentials provided by admin</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {employeeData.instaddr_account_id && (
                          <div>
                            <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                              Instaddr ID
                              <Lock className="w-3 h-3 text-[#9CA3AF]" />
                            </Label>
                            <Input
                              value={employeeData.instaddr_account_id}
                              disabled
                              className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] cursor-not-allowed"
                            />
                            <p className="text-[10px] text-[#9CA3AF] mt-1">Your Instaddr username</p>
                          </div>
                        )}

                        {employeeData.instaddr_account_email && (
                          <div>
                            <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                              Instaddr Email
                              <Lock className="w-3 h-3 text-[#9CA3AF]" />
                            </Label>
                            <Input
                              value={employeeData.instaddr_account_email}
                              disabled
                              className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] cursor-not-allowed"
                            />
                            <p className="text-[10px] text-[#9CA3AF] mt-1">Email linked to Instaddr account</p>
                          </div>
                        )}

                        {employeeData.instaddr_account_password && (
                          <div className="md:col-span-2">
                            <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                              Instaddr Password
                              <Lock className="w-3 h-3 text-[#9CA3AF]" />
                            </Label>
                            <Input
                              type="text"
                              value={employeeData.instaddr_account_password}
                              disabled
                              className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] cursor-not-allowed font-mono"
                            />
                            <p className="text-[10px] text-[#9CA3AF] mt-1">Password is visible for your convenience</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wide">Payment Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* UPI ID - EDITABLE */}
                      <div className="md:col-span-2">
                        <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-2">
                          UPI ID
                          <Edit2 className="w-3 h-3 text-[#3B82F6]" />
                        </Label>
                        <Input
                          value={employeeData.upi_id || ""}
                          onChange={(e) => {
                            setEmployeeData({ ...employeeData, upi_id: e.target.value })
                            setIsModified(true)
                          }}
                          placeholder="username@bankname (e.g., john@okhdfcbank)"
                          className="border-[#D1D5DB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10"
                        />
                        <p className="text-[10px] text-[#3B82F6] mt-1">✏️ You can edit this field</p>

                        {/* Inline Save/Cancel Buttons */}
                        {isModified && (
                          <div className="mt-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Button
                              onClick={handleSave}
                              disabled={isSaving}
                              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg font-medium disabled:bg-[#9CA3AF] disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                            >
                              {isSaving ? (
                                <>
                                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                  Saving...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </Button>
                            <Button
                              onClick={handleDiscard}
                              disabled={isSaving}
                              variant="outline"
                              className="border-[#D1D5DB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] px-4 py-2 rounded-lg font-medium text-sm bg-transparent"
                            >
                              Cancel
                            </Button>
                            {lastSaved && <p className="text-xs text-[#6B7280] ml-2">Last saved: {lastSaved}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="p-6 md:p-10 space-y-8">
                  {/* Password Change Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-[#3B82F6]" />
                      <h3 className="text-base font-bold text-[#111827]">Change Password</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Password */}
                      <div className="md:col-span-2">
                        <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2">
                          Current Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-[#6B7280]" />
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="pl-10 pr-10 border-[#D1D5DB] focus:border-[#3B82F6]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-3 text-[#6B7280] hover:text-[#111827]"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-[#3B82F6] mt-1">
                          💡 Enter your actual password (not the encoded version)
                        </p>
                      </div>

                      {/* New Password */}
                      <div>
                        <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2">
                          New Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-[#6B7280]" />
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="pl-10 pr-10 border-[#D1D5DB] focus:border-[#3B82F6]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-3 text-[#6B7280] hover:text-[#111827]"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password Requirements */}
                        {newPassword && (
                          <div className="mt-2 space-y-1">
                            <p
                              className={`text-[10px] ${newPassword.length >= 8 ? "text-[#10B981]" : "text-[#6B7280]"}`}
                            >
                              {newPassword.length >= 8 ? "✓" : "✗"} Min 8 characters
                            </p>
                            <p
                              className={`text-[10px] ${/[A-Z]/.test(newPassword) ? "text-[#10B981]" : "text-[#6B7280]"}`}
                            >
                              {/[A-Z]/.test(newPassword) ? "✓" : "✗"} Has uppercase
                            </p>
                            <p
                              className={`text-[10px] ${/[a-z]/.test(newPassword) ? "text-[#10B981]" : "text-[#6B7280]"}`}
                            >
                              {/[a-z]/.test(newPassword) ? "✓" : "✗"} Has lowercase
                            </p>
                            <p
                              className={`text-[10px] ${/[0-9]/.test(newPassword) ? "text-[#10B981]" : "text-[#6B7280]"}`}
                            >
                              {/[0-9]/.test(newPassword) ? "✓" : "✗"} Has number
                            </p>
                            <p
                              className={`text-[10px] ${/[!@#$%^&*]/.test(newPassword) ? "text-[#10B981]" : "text-[#6B7280]"}`}
                            >
                              {/[!@#$%^&*]/.test(newPassword) ? "✓" : "✗"} Has special character
                            </p>
                          </div>
                        )}

                        {/* Password Strength Meter */}
                        {newPassword && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  passwordStrength <= 2
                                    ? "bg-[#EF4444] w-1/3"
                                    : passwordStrength <= 4
                                      ? "bg-[#F59E0B] w-2/3"
                                      : "bg-[#10B981] w-full"
                                }`}
                              />
                            </div>
                            <p className="text-[10px] text-[#6B7280] mt-1">
                              Strength: {passwordStrength <= 2 ? "Weak" : passwordStrength <= 4 ? "Medium" : "Strong"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <Label className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-[#6B7280]" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className="pl-10 pr-10 border-[#D1D5DB] focus:border-[#3B82F6]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-[#6B7280] hover:text-[#111827]"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {confirmPassword && (
                          <p
                            className={`text-[10px] mt-2 ${newPassword === confirmPassword ? "text-[#10B981]" : "text-[#EF4444]"}`}
                          >
                            {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handlePasswordChange}
                      disabled={
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword ||
                        newPassword !== confirmPassword ||
                        passwordStrength < 3 ||
                        isSaving
                      }
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2 rounded-lg font-medium disabled:bg-[#9CA3AF] disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Updating Password..." : "Update Password"}
                    </Button>
                  </div>

                  {/* Session Management */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#3B82F6]" />
                      <h3 className="text-base font-bold text-[#111827]">Session Management</h3>
                    </div>

                    <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">Last Login:</span>
                        <span className="font-medium text-[#111827]">6 Nov 2025, 3:30 AM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">Active Sessions:</span>
                        <span className="font-medium text-[#111827]">1</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
