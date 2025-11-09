"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"
import Sidebar from "@/components/sidebar"
import StatCard from "@/components/stat-card"
import MonthlyChartsSection from "@/components/monthly-charts-section"
import DailyPerformanceChart from "@/components/daily-performance-chart"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("November 2025")
  const [dashboardData, setDashboardData] = useState<any>(null)

  const fetchDashboardStats = async (monthYear: string) => {
    const employeeId = localStorage.getItem("employee_id")
    if (!employeeId) return

    const [monthName, year] = monthYear.split(" ")
    const monthMap: { [key: string]: number } = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    }
    const month = monthMap[monthName]

    try {
      const response = await fetch("/api/employee/dashboard-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          month,
          year: Number.parseInt(year),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard stats:", error)
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check authentication
    const authToken = localStorage.getItem("auth_token")
    if (!authToken) {
      router.push("/")
      return
    }

    fetchDashboardStats(selectedMonth)
    setIsLoading(false)
  }, [router])

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    fetchDashboardStats(month)
  }

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          currentMonth={selectedMonth}
          onMonthChange={handleMonthChange}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Stats Grid - 4 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Lifetime"
                subtitle="Earnings"
                value={`₹${dashboardData.lifetimeEarnings.toLocaleString()}`}
                icon="dollar"
                gradient="blue"
                delay={0}
                glow={false}
              />
              <StatCard
                title="All Time"
                subtitle="Orders"
                value={dashboardData.lifetimeOrders.toLocaleString()}
                icon="package"
                gradient="green"
                delay={100}
                glow={false}
              />
              <StatCard
                title="This Month"
                subtitle="Earnings"
                value={`₹${dashboardData.monthEarnings.toLocaleString()}`}
                icon="trending"
                gradient="amber"
                delay={200}
                glow={false}
              />
              <StatCard
                title="Active Streak"
                subtitle="Current"
                value={`${dashboardData.activeStreak} Days 🔥`}
                icon="flame"
                gradient="pink"
                delay={300}
                glow={true}
              />
            </div>

            {/* Monthly Charts Section */}
            <MonthlyChartsSection data={{ ...dashboardData, current_month: selectedMonth }} />

            {/* Daily Performance Chart */}
            <div className="mt-8">
              <DailyPerformanceChart data={{ ...dashboardData, current_month: selectedMonth }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
