"use client"

import { Check } from "lucide-react"
import { useEffect, useState } from "react"

interface StepIndicatorProps {
  currentStep: number
}

const steps = [
  { number: 1, label: "Select Slot" },
  { number: 2, label: "Order Type" },
  { number: 3, label: "Add Orders" },
  { number: 4, label: "Review" },
]

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number
          const isUpcoming = currentStep < step.number

          return (
            <div key={step.number} className="flex flex-col items-center flex-1 relative">
              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-5 left-[50%] w-full h-0.5 -z-10">
                  <div
                    className={`h-full transition-all duration-500 ${isCompleted ? "bg-[#3B82F6]" : "bg-[#D1D5DB]"}`}
                    style={{
                      width: mounted ? "100%" : "0%",
                      transitionDelay: `${index * 100}ms`,
                    }}
                  />
                </div>
              )}

              {/* Circle */}
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#10B981] text-white scale-100"
                    : isCurrent
                      ? "bg-[#3B82F6] text-white border-2 border-[#3B82F6] scale-110"
                      : "bg-[#E5E7EB] text-[#9CA3AF] border border-[#D1D5DB]"
                }`}
                style={{
                  transform: mounted ? (isCurrent ? "scale(1.1)" : "scale(1)") : "scale(0.5)",
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.number}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs md:text-sm font-medium text-center ${
                  isCurrent ? "text-[#3B82F6]" : isCompleted ? "text-[#10B981]" : "text-[#9CA3AF]"
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
