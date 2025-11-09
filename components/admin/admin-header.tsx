"use client"

import { Menu, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import MonthSelector from "../month-selector"
import Image from "next/image"

interface AdminHeaderProps {
  onMenuClick: () => void
  currentMonth?: string
  onMonthChange?: (month: string) => void
}

export default function AdminHeader({ onMenuClick, currentMonth, onMonthChange }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("admin_auth_token")
    localStorage.removeItem("admin_username")
    router.push("/login")
  }

  const username = typeof window !== "undefined" ? localStorage.getItem("admin_username") || "Admin" : "Admin"

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Team Krishna Arora"
              width={40}
              height={40}
              className="object-contain hidden sm:block"
            />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </div>

        {currentMonth && onMonthChange && (
          <div className="hidden sm:block">
            <MonthSelector selectedMonth={currentMonth} onMonthChange={onMonthChange} />
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm text-gray-600">Logged in as,</p>
            <p className="text-sm font-bold text-gray-900">{username}</p>
          </div>
          <span className="hidden sm:inline text-gray-400">|</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
