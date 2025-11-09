"use client"

import { X, Home, Users, LogOut, Calendar, CheckCircle, DollarSign } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("admin_auth_token")
    localStorage.removeItem("admin_username")
    router.push("/login")
  }

  const username = typeof window !== "undefined" ? localStorage.getItem("admin_username") || "Admin" : "Admin"

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
    { icon: CheckCircle, label: "Approvals", href: "/admin/approvals" },
    { icon: Users, label: "Employees", href: "/admin/employees" },
    { icon: Calendar, label: "Slots", href: "/admin/slots" },
    { icon: DollarSign, label: "Payments", href: "/admin/payments" },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-40" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative w-64 h-screen bg-white border-r border-gray-200 transition-transform duration-300 z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Team Krishna Arora" width={48} height={48} className="object-contain" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Team Krishna</h2>
              <p className="text-xs text-gray-600 mt-0.5">Arora Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center h-11 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? "bg-purple-50 text-purple-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="px-2 py-3 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center text-sm font-bold mb-2">
              {username.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-bold text-gray-900">{username}</p>
            <p className="text-xs text-gray-600">Administrator</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
