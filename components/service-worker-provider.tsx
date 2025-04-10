"use client"

import type React from "react"

import { useEffect } from "react"
import { registerServiceWorker } from "@/utils/service-worker"

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    registerServiceWorker()

    return () => {
      // No need to unregister on component unmount
    }
  }, [])

  return <>{children}</>
}
