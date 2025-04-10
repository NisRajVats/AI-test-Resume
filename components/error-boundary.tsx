"use client"

import React from "react"
import { DatabaseFallback } from "@/components/database-fallback"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Check if it's a database error
      const isDatabaseError =
        this.state.error?.message.includes("database") ||
        this.state.error?.message.includes("relation") ||
        this.state.error?.message.includes("table") ||
        this.state.error?.message.includes("column") ||
        this.state.error?.message.includes("does not exist") ||
        this.state.error?.message.includes("connection") ||
        this.state.error?.message.includes("supabase") ||
        this.state.error?.message.includes("postgres") ||
        this.state.error?.message.includes("redis") ||
        this.state.error?.message.includes("neon")

      if (isDatabaseError) {
        return <DatabaseFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />
      }

      // Use custom fallback if provided, otherwise use default error UI
      return this.props.fallback ? (
        this.props.fallback
      ) : (
        <div className="p-4 rounded-md bg-red-50 border border-red-200">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md"
            onClick={this.resetErrorBoundary}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
