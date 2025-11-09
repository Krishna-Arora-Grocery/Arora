import { createHash } from "crypto"

export function hashPassword(password: string): string {
  // Simple hash for demo - in production, use bcrypt or similar
  return createHash("sha256").update(password).digest("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}
