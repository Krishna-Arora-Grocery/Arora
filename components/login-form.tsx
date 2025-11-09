"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react"
import { loginUser } from "@/lib/auth"

type FormState = "idle" | "loading" | "success" | "error"
type LoginType = "employee" | "admin"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formState, setFormState] = useState<FormState>("idle")
  const [error, setError] = useState("")
  const [isFormVisible, setIsFormVisible] = useState(false)

  const validateForm = () => {
    if (!email) {
      setError("Username or Email is required")
      return false
    }
    if (!password) {
      setError("Password is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      setFormState("error")
      return
    }

    setFormState("loading")

    try {
      const { user, error: loginError } = await loginUser(email, password)

      if (loginError || !user) {
        setFormState("error")
        setError(loginError || "Invalid username or password")
        return
      }

      setFormState("success")

      if (rememberMe) {
        localStorage.setItem("remember_email", email)
      }

      if (user.role === "admin") {
        localStorage.setItem("admin_auth_token", `admin_token_${Date.now()}`)
        localStorage.setItem("admin_username", email)
        localStorage.setItem("admin_id", user.id)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("username")
        localStorage.removeItem("employee_id")
        router.push("/admin/dashboard")
      } else {
        localStorage.setItem("auth_token", `token_${Date.now()}`)
        localStorage.setItem("username", email.split("@")[0])
        localStorage.setItem("employee_id", user.id)
        localStorage.removeItem("admin_auth_token")
        localStorage.removeItem("admin_username")
        localStorage.removeItem("admin_id")
        router.push("/employee/dashboard")
      }
    } catch (err) {
      console.error("[v0] Login error:", err)
      setFormState("error")
      setError("An error occurred during login")
    }
  }

  useEffect(() => {
    setIsFormVisible(true)
  }, [])

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 lg:p-12 bg-[#F9FAFB]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div
          className={`mb-8 transition-all duration-1000 transform ${
            isFormVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          }`}
        >
          <h2 className="text-3xl font-bold text-[#111827] mb-2">Welcome Back</h2>
          <p className="text-[#6B7280]">Sign in to your dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email/Username Input */}
          <div
            className={`transition-all duration-1000 transform delay-150 ${
              isFormVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <label className="block text-sm font-medium text-[#111827] mb-2">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[#6B7280]" />
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                placeholder="Enter Username or Email"
                className="w-full pl-10 pr-4 py-2.5 border-2 border-[#E5E7EB] rounded-lg focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/10 transition-all duration-300 text-[#111827] placeholder-[#6B7280]"
              />
            </div>
          </div>

          {/* Password Input */}
          <div
            className={`transition-all duration-1000 transform delay-300 ${
              isFormVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <label className="block text-sm font-medium text-[#111827] mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[#6B7280]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 border-2 border-[#E5E7EB] rounded-lg focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/10 transition-all duration-300 text-[#111827] placeholder-[#6B7280]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="animate-in fade-in duration-300 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              <p className="text-sm text-[#DC2626]">{error}</p>
            </div>
          )}

          {/* Remember Me */}
          <div
            className={`flex items-center transition-all duration-1000 transform delay-500 ${
              isFormVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-[#3B82F6] border-[#E5E7EB] rounded focus:ring-[#3B82F6] cursor-pointer"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-[#6B7280] cursor-pointer">
              Remember me
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={formState === "loading" || formState === "success"}
            className={`w-full py-2.5 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-70 flex items-center justify-center gap-2 ${
              formState === "success" ? "bg-[#10B981]" : "bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:shadow-lg"
            }`}
          >
            {formState === "loading" && (
              <>
                <Spinner />
                <span>Signing in...</span>
              </>
            )}
            {formState === "success" && (
              <>
                <Check className="w-5 h-5" />
                <span>Signed in successfully!</span>
              </>
            )}
            {formState === "idle" && formState !== "error" && <span>Sign In</span>}
            {formState === "error" && <span>Try Again</span>}
          </button>
        </form>

        {/* Footer Text */}
        <p className="text-center text-xs text-[#6B7280] mt-6">Protected by industry-standard security</p>
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
}
