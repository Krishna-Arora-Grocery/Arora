"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown } from "lucide-react"

interface MonthSelectorProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export default function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const months = [
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

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMonthSelect = (month: string, year: number) => {
    onMonthChange(`${month} ${year}`)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
      >
        <Calendar className="w-5 h-5 text-blue-600" />
        <span className="text-lg font-bold text-blue-600">{selectedMonth}</span>
        <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-64 max-h-96 overflow-y-auto">
          {years.map((year) => (
            <div key={year} className="border-b border-gray-100 last:border-b-0">
              <div className="px-4 py-2 bg-gray-50 font-semibold text-sm text-gray-700 sticky top-0">{year}</div>
              <div className="grid grid-cols-2 gap-1 p-2">
                {months.map((month) => {
                  const monthYear = `${month} ${year}`
                  const isSelected = selectedMonth === monthYear
                  return (
                    <button
                      key={month}
                      onClick={() => handleMonthSelect(month, year)}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${
                        isSelected ? "bg-blue-600 text-white font-semibold" : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {month.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
