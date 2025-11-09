"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { nhost } from "./nhost"
import { useRouter } from "next/navigation"
import { apolloClient } from "./apollo-client"
import { GET_EMPLOYEE_BY_USER_ID } from "./graphql/queries"

interface Employee {
  id: string
  user_id: string
  name: string
  email: string
  username: string
  role: "admin" | "employee"
  status: string
  upi_id?: string
}

interface AuthContextType {
  user: any
  employee: Employee | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
  isEmployee: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const session = nhost.auth.getSession()
      if (session) {
        setUser(session.user)
        await fetchEmployeeData(session.user.id)
      }
      setLoading(false)
    }

    checkAuth()

    // Listen for auth state changes
    const { data } = nhost.auth.onAuthStateChanged(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setUser(session.user)
        await fetchEmployeeData(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setEmployee(null)
      }
    })

    return () => {
      data?.unsubscribe()
    }
  }, [])

  const fetchEmployeeData = async (userId: string) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_EMPLOYEE_BY_USER_ID,
        variables: { userId },
      })

      if (data?.employees?.[0]) {
        setEmployee(data.employees[0])
      }
    } catch (error) {
      console.error("[v0] Error fetching employee data:", error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { session, error } = await nhost.auth.signIn({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (session) {
      setUser(session.user)
      await fetchEmployeeData(session.user.id)
    }
  }

  const signOut = async () => {
    await nhost.auth.signOut()
    setUser(null)
    setEmployee(null)
    router.push("/login")
  }

  const isAdmin = employee?.role === "admin"
  const isEmployee = employee?.role === "employee"

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        loading,
        signIn,
        signOut,
        isAdmin,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
