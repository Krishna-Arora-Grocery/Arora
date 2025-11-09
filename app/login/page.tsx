"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import GradientSide from "@/components/gradient-side"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token")
      if (token) {
        router.push("/employee/dashboard")
      }
    }
  }, [router])

  return (
    <div className="min-h-screen flex">
      <GradientSide />
      <LoginForm
        onLoginSuccess={(email: string) => {
          // Store auth token and username
          localStorage.setItem("auth_token", "demo_token_" + Date.now())
          localStorage.setItem("username", email.split("@")[0])
          // Redirect to dashboard
          router.push("/employee/dashboard")
        }}
      />
    </div>
  )
}
