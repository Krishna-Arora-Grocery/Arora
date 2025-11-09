"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Plus,
  Edit,
  Key,
  Trash2,
  Copy,
  Phone,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  User,
  Send,
  FileSpreadsheet,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllEmployees, updateEmployee, deleteEmployee, createEmployee } from "@/lib/graphql/admin-queries"

type Employee = {
  id: string
  full_name: string
  email: string
  username: string
  mobile_number: string
  telegram_username: string | null
  total_ids_given: number
  instaddr_username: string | null
  instaddr_email: string | null
  instaddr_password: string | null
  upi_id: string | null
  excel_link: string | null
  status: "active" | "inactive"
  joined_date: string
}

export default function AdminEmployeesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [sortBy, setSortBy] = useState<"name" | "email" | "username" | "joined">("name")

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [editForm, setEditForm] = useState<Partial<Employee>>({})

  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    mobile_number: "",
    telegram_username: "",
    instaddr_username: "",
    instaddr_email: "",
    instaddr_password: "",
    upi_id: "",
    excel_link: "",
  })

  // client-mounted guard
  useEffect(() => {
    setMounted(true)
  }, [])

  // load employees & auth check
  useEffect(() => {
    // ensure we only access localStorage in the browser
    const authToken = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
    if (!authToken) {
      router.push("/login")
      return
    }

    const loadEmployees = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await getAllEmployees()

        if (error) {
          console.error("[v0] Error fetching employees:", error)
          toast({
            title: "Error",
            description: "Failed to load employees",
            variant: "destructive",
          })
          return
        }

        const formattedEmployees = (data?.employees || []).map((emp: any) => ({
          id: emp.id,
          full_name: emp.name,
          email: emp.email,
          username: emp.username,
          mobile_number: emp.mobile_number || "N/A",
          telegram_username: emp.telegram_username ?? null,
          total_ids_given: emp.total_ids_given ?? 0,
          instaddr_username: emp.instaddr_account_id ?? null,
          instaddr_email: emp.instaddr_account_email ?? null,
          instaddr_password: emp.instaddr_account_password ?? null,
          upi_id: emp.upi_id ?? null,
          excel_link: emp.excel_link ?? null,
          status: emp.status ?? "active",
          joined_date: emp.created_at ?? new Date().toISOString(),
        }))

        setEmployees(formattedEmployees)
        setFilteredEmployees(formattedEmployees)
      } catch (err) {
        console.error("[v0] Employee fetch error:", err)
        toast({
          title: "Error",
          description: "Failed to load employees",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployees()
  }, [router, toast])

  // filtering + sorting
  useEffect(() => {
    let filtered = [...employees]

    if (filterStatus !== "all") {
      filtered = filtered.filter((emp) => emp.status === filterStatus)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(query) ||
          emp.username.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query),
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.full_name.localeCompare(b.full_name)
        case "email":
          return a.email.localeCompare(b.email)
        case "username":
          return a.username.localeCompare(b.username)
        case "joined":
          return new Date(b.joined_date).getTime() - new Date(a.joined_date).getTime()
        default:
          return 0
      }
    })

    setFilteredEmployees(filtered)
  }, [employees, searchQuery, filterStatus, sortBy])

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee)
    setEditForm(employee)
    setEditModalOpen(true)
  }

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return

    setIsSaving(true)

    try {
      const { data, error } = await updateEmployee(selectedEmployee.id, {
        name: editForm.full_name,
        email: editForm.email,
        username: editForm.username,
        telegram_username: editForm.telegram_username,
        total_ids_given: editForm.total_ids_given,
        instaddr_account_id: editForm.instaddr_username,
        instaddr_account_email: editForm.instaddr_email,
        instaddr_account_password: editForm.instaddr_password,
        upi_id: editForm.upi_id,
        excel_link: editForm.excel_link,
        mobile_number: editForm.mobile_number,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw new Error(error)
      }

      setEmployees((prev) =>
        prev.map((emp) => (emp.id === selectedEmployee.id ? { ...emp, ...(editForm as Employee) } : emp)),
      )

      toast({
        title: "Success",
        description: "Employee updated successfully!",
      })
    } catch (err) {
      console.error("[v0] Update employee error:", err)
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setEditModalOpen(false)
    }
  }

  const handleResetPassword = async () => {
    // generate temporary password only on user action
    const tempPassword = `Temp${Math.random().toString(36).substring(2, 8)}@2025`
    setNewPassword(tempPassword)

    toast({
      title: "Password Reset",
      description: `New password generated for ${selectedEmployee?.full_name ?? "employee"}`,
    })
  }

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return

    if (deleteConfirmName.toLowerCase() !== selectedEmployee.full_name.toLowerCase()) {
      toast({
        title: "Error",
        description: "Employee name doesn't match. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const { error } = await deleteEmployee(selectedEmployee.id)

      if (error) {
        throw new Error(error)
      }

      setEmployees((prev) => prev.filter((emp) => emp.id !== selectedEmployee.id))

      toast({
        title: "Deleted",
        description: `${selectedEmployee.full_name} has been removed.`,
      })
    } catch (err) {
      console.error("[v0] Delete employee error:", err)
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setDeleteModalOpen(false)
      setDeleteConfirmName("")
    }
  }

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
      toast({
        title: "Copied",
        description: "Copied to clipboard!",
      })
    } else {
      // fallback
      try {
        const el = document.createElement("textarea")
        el.value = text
        document.body.appendChild(el)
        el.select()
        document.execCommand("copy")
        document.body.removeChild(el)
        toast({
          title: "Copied",
          description: "Copied to clipboard!",
        })
      } catch {
        toast({
          title: "Error",
          description: "Unable to copy",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddEmployee = async () => {
    if (!addForm.full_name || !addForm.email || !addForm.username || !addForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const result = await createEmployee({
        name: addForm.full_name,
        email: addForm.email,
        username: addForm.username,
        password_hash: addForm.password,
        mobile_number: addForm.mobile_number || null,
        telegram_username: addForm.telegram_username || null,
        instaddr_account_id: addForm.instaddr_username || null,
        instaddr_account_email: addForm.instaddr_email || null,
        instaddr_account_password: addForm.instaddr_password || null,
        upi_id: addForm.upi_id || null,
        excel_link: addForm.excel_link || null,
        role: "employee",
        status: "active",
      })

      console.log("[v0] Create employee result:", result)

      if (result.error || !result.data) {
        throw new Error(result.error || "Failed to create employee")
      }

      const newEmployee: Employee = {
        id: result.data.insert_employees_one.id,
        full_name: addForm.full_name,
        email: addForm.email,
        username: addForm.username,
        mobile_number: addForm.mobile_number || "N/A",
        telegram_username: addForm.telegram_username || null,
        total_ids_given: 0,
        instaddr_username: addForm.instaddr_username || null,
        instaddr_email: addForm.instaddr_email || null,
        instaddr_password: addForm.instaddr_password || null,
        upi_id: addForm.upi_id || null,
        excel_link: addForm.excel_link || null,
        status: "active",
        joined_date: new Date().toISOString(),
      }

      setEmployees((prev) => [newEmployee, ...prev])

      toast({
        title: "Success",
        description: "Employee created successfully!",
      })

      setAddForm({
        full_name: "",
        email: "",
        username: "",
        password: "",
        mobile_number: "",
        telegram_username: "",
        instaddr_username: "",
        instaddr_email: "",
        instaddr_password: "",
        upi_id: "",
        excel_link: "",
      })
      setAddModalOpen(false)
    } catch (err: any) {
      console.error("[v0] Create employee error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create employee",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // If app hasn't mounted on client yet, render a stable spinner to avoid hydration mismatch
  if (!mounted || isLoading) {
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
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Employees</h2>
              <p className="text-sm text-gray-600 mt-1">Manage employee profiles and details</p>
            </div>

            <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, username, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Employees</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="email">Email</option>
                  <option value="username">Username</option>
                  <option value="joined">Joined Date (Newest)</option>
                </select>
              </div>

              <Button onClick={() => setAddModalOpen(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Showing {filteredEmployees.length} of {employees.length} employees
            </div>

            <div className="border border-gray-200 rounded-lg" />

            {filteredEmployees.length > 0 ? (
              <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">Profile</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead className="text-center">Total IDs</TableHead>
                      <TableHead>Excel Link</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee, index) => (
                      <TableRow
                        key={employee.id}
                        className="hover:bg-gray-50 transition-colors"
                        style={{
                          animation: "fadeIn 0.3s ease-out",
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        <TableCell>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {employee.full_name.charAt(0).toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleEditClick(employee)}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
                          >
                            {employee.full_name}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-gray-600">{employee.username}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{employee.email}</span>
                            <button
                              onClick={() => handleCopy(employee.email)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Copy className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{employee.mobile_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                            {employee.total_ids_given}
                          </span>
                        </TableCell>
                        <TableCell>
                          {employee.excel_link ? (
                            <a
                              href={employee.excel_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-green-600" />
                              View
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleEditClick(employee)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setResetPasswordModalOpen(true)
                              }}
                              className="text-orange-600 hover:bg-orange-50"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setDeleteModalOpen(true)
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No employees found</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first employee to get started"}
                </p>
                {!searchQuery && filterStatus === "all" && (
                  <Button onClick={() => setAddModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Add First Employee
                  </Button>
                )}
              </div>
            )}

            <div className="md:hidden space-y-4">
              {filteredEmployees.map((employee, index) => (
                <div
                  key={employee.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                  style={{
                    animation: "fadeIn 0.3s ease-out",
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {employee.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{employee.full_name}</h3>
                      <p className="text-xs text-gray-600 font-mono">{employee.username}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                      {employee.total_ids_given} IDs
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {employee.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {employee.mobile_number}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      {employee.excel_link ? (
                        <a
                          href={employee.excel_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Link
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditClick(employee)} className="flex-1">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEmployee(employee)
                        setResetPasswordModalOpen(true)
                      }}
                      className="flex-1"
                    >
                      <Key className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEmployee(employee)
                        setDeleteModalOpen(true)
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Employee Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information and details</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="instaddr">Instaddr Account</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                  <Input
                    value={editForm.full_name ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={editForm.email ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                  <p className="text-xs text-orange-600 mt-1">Changing email requires re-verification</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
                  <Input
                    value={editForm.username ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    placeholder="johndoe"
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique identifier</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile Number</label>
                  <Input
                    type="tel"
                    value={editForm.mobile_number ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Telegram Username</label>
                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={editForm.telegram_username ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, telegram_username: e.target.value })}
                      placeholder="@username"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Total IDs Given</label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.total_ids_given ?? 0}
                    onChange={(e) =>
                      setEditForm({ ...editForm, total_ids_given: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Excel Link (All IDs)
                  </label>
                  <Input
                    value={editForm.excel_link ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, excel_link: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide the Excel/Google Sheets link with all employee IDs
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="instaddr" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Instaddr ID</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                    <Input
                      value={editForm.instaddr_username ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, instaddr_username: e.target.value })}
                      placeholder="username"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email inbox service username</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Instaddr Email</label>
                  <Input
                    type="email"
                    value={editForm.instaddr_email ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, instaddr_email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Instaddr Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={editForm.instaddr_password ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, instaddr_password: e.target.value })}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Keep confidential</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">UPI ID</label>
                <Input
                  value={editForm.upi_id ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, upi_id: e.target.value })}
                  placeholder="username@bankname"
                />
                <p className="text-xs text-gray-500 mt-1">UPI format: username@bankname</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEmployee} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordModalOpen} onOpenChange={setResetPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Generate a new temporary password for {selectedEmployee?.full_name ?? "employee"}
            </DialogDescription>
          </DialogHeader>

          {newPassword ? (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">New temporary password:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-orange-300 rounded font-mono text-sm">
                    {newPassword}
                  </code>
                  <Button size="icon-sm" variant="outline" onClick={() => handleCopy(newPassword)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-600">Employee should change this password on first login</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              This will generate a random temporary password and update the employee's account.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordModalOpen(false)
                setNewPassword("")
              }}
            >
              {newPassword ? "Close" : "Cancel"}
            </Button>
            {!newPassword && (
              <Button onClick={handleResetPassword} className="bg-orange-600 hover:bg-orange-700">
                Reset Password
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Employee
            </DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-2">
                Deleting '{selectedEmployee?.full_name ?? "employee"}' will remove:
              </p>
              <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                <li>All profile data</li>
                <li>Login credentials</li>
                <li>Historical orders</li>
                <li>Commission records (archived)</li>
              </ul>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Type employee name to confirm</label>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={
                  selectedEmployee?.full_name
                    ? `Type '${selectedEmployee.full_name}' to confirm`
                    : "Type employee name to confirm"
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setDeleteConfirmName("")
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEmployee}
              disabled={
                isSaving ||
                !selectedEmployee ||
                deleteConfirmName.toLowerCase() !== (selectedEmployee?.full_name ?? "").toLowerCase()
              }
            >
              {isSaving ? "Deleting..." : "Delete Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Create a new employee account with login credentials</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="instaddr">Instaddr Account</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    placeholder="johndoe"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile Number</label>
                  <Input
                    type="tel"
                    value={addForm.mobile_number}
                    onChange={(e) => setAddForm({ ...addForm, mobile_number: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Telegram Username</label>
                  <Input
                    value={addForm.telegram_username}
                    onChange={(e) => setAddForm({ ...addForm, telegram_username: e.target.value })}
                    placeholder="@username"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Excel Link (All IDs)
                  </label>
                  <Input
                    value={addForm.excel_link}
                    onChange={(e) => setAddForm({ ...addForm, excel_link: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide the Excel/Google Sheets link with all employee IDs
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="instaddr" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Instaddr ID</label>
                  <Input
                    value={addForm.instaddr_username}
                    onChange={(e) => setAddForm({ ...addForm, instaddr_username: e.target.value })}
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Instaddr Email</label>
                  <Input
                    type="email"
                    value={addForm.instaddr_email}
                    onChange={(e) => setAddForm({ ...addForm, instaddr_email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Instaddr Password</label>
                  <Input
                    type="password"
                    value={addForm.instaddr_password}
                    onChange={(e) => setAddForm({ ...addForm, instaddr_password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">UPI ID</label>
                <Input
                  value={addForm.upi_id}
                  onChange={(e) => setAddForm({ ...addForm, upi_id: e.target.value })}
                  placeholder="username@bankname"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setAddModalOpen(false)
                setAddForm({
                  full_name: "",
                  email: "",
                  username: "",
                  password: "",
                  mobile_number: "",
                  telegram_username: "",
                  instaddr_username: "",
                  instaddr_email: "",
                  instaddr_password: "",
                  upi_id: "",
                  excel_link: "",
                })
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddEmployee} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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
