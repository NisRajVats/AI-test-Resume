"use client"

import type React from "react"

import { Suspense } from "react"
import { LoadingFallback } from "@/components/loading-fallback"

interface SuspenseBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  title?: string
  description?: string
}

export function SuspenseBoundary({ children, fallback, title, description }: SuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback || <LoadingFallback title={title} description={description} />}>{children}</Suspense>
  )
}
