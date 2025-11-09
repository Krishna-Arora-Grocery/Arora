"use client"

import type React from "react"
// import { ApolloProvider } from "@apollo/client"
// import { apolloClient } from "./apollo-client"
import { ErrorBoundary } from "@/components/error-boundary"

export function Providers({ children }: { children: React.ReactNode }) {
  console.log("[v0] Providers mounting")

  // Will add back once packages are properly installed
  return <ErrorBoundary>{children}</ErrorBoundary>
}

// Will add back once packages are properly installed
// return <>{children}</>
