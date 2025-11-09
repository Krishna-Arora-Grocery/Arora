// Get all employees
export async function getAllEmployees() {
  try {
    const response = await fetch("/api/employees/list")
    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || "Failed to fetch employees" }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    console.error("[v0] Employee fetch error:", error)
    return { data: null, error: error.message || "Failed to fetch employees" }
  }
}

// Get all slots
export async function getAllSlots() {
  try {
    const response = await fetch("/api/slots")
    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || "Failed to fetch slots" }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    console.error("[v0] Slots fetch error:", error)
    return { data: null, error: error.message || "Failed to fetch slots" }
  }
}

// Get dashboard stats
export async function getDashboardStats() {
  try {
    const response = await fetch("/api/admin/stats")
    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || "Failed to fetch dashboard stats" }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    console.error("[v0] Dashboard fetch error:", error)
    return { data: null, error: error.message || "Failed to fetch dashboard stats" }
  }
}

// Create employee
export async function createEmployee(employeeData: any) {
  try {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "create",
        data: employeeData,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || "Failed to create employee" }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    console.error("[v0] Create employee error:", error)
    return { data: null, error: error.message || "Failed to create employee" }
  }
}

// Update employee
export async function updateEmployee(id: string, updates: any) {
  try {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update",
        data: { id, updates },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || "Failed to update employee" }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    console.error("[v0] Update employee error:", error)
    return { data: null, error: error.message || "Failed to update employee" }
  }
}

// Delete employee
export async function deleteEmployee(id: string) {
  try {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
        data: { id },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || "Failed to delete employee" }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    console.error("[v0] Delete employee error:", error)
    return { data: null, error: error.message || "Failed to delete employee" }
  }
}

// Create slot
export async function createSlot(slotData: any) {
  try {
    const response = await fetch("/api/slots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "create",
        data: slotData,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || "Failed to create slot" }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    console.error("[v0] Create slot error:", error)
    return { data: null, error: error.message || "Failed to create slot" }
  }
}

// Update slot
export async function updateSlot(id: string, updates: any) {
  try {
    const response = await fetch("/api/slots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update",
        data: { id, updates },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || "Failed to update slot" }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    console.error("[v0] Update slot error:", error)
    return { data: null, error: error.message || "Failed to update slot" }
  }
}

// Delete slot
export async function deleteSlot(id: string) {
  try {
    const response = await fetch("/api/slots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
        data: { id },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || "Failed to delete slot" }
    }

    return { data: result.data, error: null }
  } catch (error: any) {
    console.error("[v0] Delete slot error:", error)
    return { data: null, error: error.message || "Failed to delete slot" }
  }
}
