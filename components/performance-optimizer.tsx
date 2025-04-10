"use client"

import { useEffect, useRef } from "react"

// This component helps optimize performance by cleaning up resources
// and implementing performance best practices
export function PerformanceOptimizer() {
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any cached responses that are older than 1 hour
    const clearOldCache = () => {
      const cacheKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("ai_response_") || key.startsWith("upload_"),
      )

      const now = Date.now()
      const oneHour = 60 * 60 * 1000

      cacheKeys.forEach((key) => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "{}")
          if (item.timestamp && now - item.timestamp > oneHour) {
            localStorage.removeItem(key)
          }
        } catch (e) {
          // If we can't parse it, it's probably not a valid cache item
          console.warn(`Failed to parse cache item: ${key}`)
        }
      })
    }

    // Set up periodic cleanup
    cleanupTimerRef.current = setInterval(clearOldCache, 15 * 60 * 1000) // Every 15 minutes

    // Initial cleanup
    clearOldCache()

    // Report performance metrics
    if ("performance" in window && "getEntriesByType" in performance) {
      // Wait for page to fully load
      window.addEventListener("load", () => {
        setTimeout(() => {
          const navigationEntries = performance.getEntriesByType("navigation")
          if (navigationEntries.length > 0) {
            const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming
            console.log("Page Load Time:", navigationEntry.loadEventEnd - navigationEntry.startTime, "ms")
          }

          // Get resource timing entries
          const resourceEntries = performance.getEntriesByType("resource")
          const slowResources = resourceEntries
            .filter((entry) => entry.duration > 500)
            .map((entry) => ({
              name: entry.name,
              duration: entry.duration,
            }))

          if (slowResources.length > 0) {
            console.warn("Slow resources:", slowResources)
          }

          // Clear performance entries to avoid memory leaks
          performance.clearResourceTimings()
        }, 0)
      })
    }

    return () => {
      // Clean up timer on unmount
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current)
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}
