export interface User {
  id: string
  name: string
  email: string
  username: string
  role: "admin" | "employee"
  telegram_username?: string
  total_ids_given?: number
  upi_id?: string
}

export async function loginUser(
  username: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { user: null, error: result.error || "Login failed" }
    }

    const user = result.user

    // Store user data in localStorage
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("userId", user.id)
    localStorage.setItem("userRole", user.role)

    if (user.role === "admin") {
      localStorage.setItem("admin_auth_token", `admin_token_${Date.now()}`)
      localStorage.setItem("admin_username", user.username)
    } else {
      localStorage.setItem("auth_token", `token_${Date.now()}`)
      localStorage.setItem("username", user.username)
    }

    return { user, error: null }
  } catch (error) {
    console.error("Login error:", error)
    return { user: null, error: "An error occurred during login" }
  }
}

export function logoutUser() {
  localStorage.removeItem("user")
  localStorage.removeItem("userId")
  localStorage.removeItem("userRole")
  localStorage.removeItem("auth_token")
  localStorage.removeItem("admin_auth_token")
  localStorage.removeItem("username")
  localStorage.removeItem("admin_username")
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("user")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === "admin"
}
