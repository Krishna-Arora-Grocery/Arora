"use client"
import LoginForm from "@/components/login-form"
import GradientSide from "@/components/gradient-side"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <GradientSide />
      <LoginForm />
    </div>
  )
}
