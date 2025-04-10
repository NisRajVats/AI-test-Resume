"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { ensureDatabaseTables, createHelperFunctions } from "@/lib/db-init"

interface ErrorFallbackProps {
  error: Error | string
  resetErrorBoundary?: () => void
  title?: string
  description?: string
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = "Something went wrong",
  description = "There was an error loading this content",
}: ErrorFallbackProps) {
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null)

  const errorMessage = typeof error === "string" ? error : error.message
  const isDatabaseError = errorMessage.includes("does not exist") || errorMessage.includes("relation")

  const handleFixDatabase = async () => {
    setIsFixing(true)
    setFixResult(null)

    try {
      // First create helper functions
      await createHelperFunctions()

      // Then ensure all tables exist
      const result = await ensureDatabaseTables()

      if (result.success) {
        setFixResult({
          success: true,
          message:
            result.created.length > 0
              ? `Created missing tables: ${result.created.join(", ")}`
              : "All database tables are now available",
        })
      } else {
        setFixResult({
          success: false,
          message: "Failed to fix database issues. Please try again later.",
        })
      }
    } catch (error) {
      console.error("Error fixing database:", error)
      setFixResult({
        success: false,
        message: "An unexpected error occurred while fixing the database.",
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>

        {isDatabaseError && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This appears to be a database issue. The required tables may not exist in your database.
            </p>

            {fixResult && (
              <Alert variant={fixResult.success ? "default" : "destructive"}>
                <AlertTitle>{fixResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{fixResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {resetErrorBoundary && (
          <Button variant="outline" onClick={resetErrorBoundary}>
            Try Again
          </Button>
        )}

        {isDatabaseError && (
          <Button onClick={handleFixDatabase} disabled={isFixing}>
            {isFixing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Fixing Database...
              </>
            ) : (
              "Fix Database Issues"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
