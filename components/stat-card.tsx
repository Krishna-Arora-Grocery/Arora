"use client"

import { useEffect, useState } from "react"
import { DollarSign, Package, TrendingUp, Flame } from "lucide-react"

interface StatCardProps {
  title: string
  subtitle: string
  value: string
  icon: "dollar" | "package" | "trending" | "flame"
  gradient: "blue" | "green" | "amber" | "pink"
  delay?: number
  glow?: boolean
}

const gradients = {
  blue: "from-blue-500 to-cyan-500",
  green: "from-green-500 to-emerald-500",
  amber: "from-amber-500 to-orange-500",
  pink: "from-pink-500 to-rose-500",
}

const iconMap = {
  dollar: DollarSign,
  package: Package,
  trending: TrendingUp,
  flame: Flame,
}

export default function StatCard({ title, subtitle, value, icon, gradient, delay = 0, glow = false }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState("0")
  const Icon = iconMap[icon]

  useEffect(() => {
    const numValue = Number.parseInt(value.replace(/[^0-9]/g, ""))
    const timer = setTimeout(() => {
      const duration = 1500
      const startTime = Date.now()
      const increment = numValue / (duration / 50)

      const counter = setInterval(() => {
        const elapsed = Date.now() - startTime
        if (elapsed >= duration) {
          setDisplayValue(value)
          clearInterval(counter)
        } else {
          const current = Math.floor(increment * (elapsed / 50))
          setDisplayValue(value.replace(/\d+/, current.toString()))
        }
      }, 50)

      return () => clearInterval(counter)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <div
      className="group"
      style={{
        animation: `slideInUp 0.6s ease-out`,
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div
        className={`relative h-40 bg-gradient-to-br ${gradients[gradient]} rounded-2xl p-6 text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer`}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-10 rounded-2xl border border-white/30" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/90 text-xs font-semibold">{title}</p>
              <p className="text-white/80 text-xs mt-0.5">{subtitle}</p>
            </div>
            <div
              className={`p-2.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 ${
                glow && icon === "flame" ? "animate-pulse" : ""
              }`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>

          <p className="text-3xl font-bold text-white mt-auto">{displayValue}</p>
        </div>

        <div className="absolute -inset-1 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300" />
      </div>
    </div>
  )
}
