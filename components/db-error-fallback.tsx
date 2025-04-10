"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"

interface DbErrorFallbackProps {
  error: Error | string
  resetErrorBoundary?: () => void
  title?: string
  description?: string
}

export function DbErrorFallback({
  error,
  resetErrorBoundary,
  title = "Database Error",
  description = "There was an error connecting to the database",
}: DbErrorFallbackProps) {
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null)

  const errorMessage = typeof error === "string" ? error : error.message

  const handleFixDatabase = async () => {
    setIsFixing(true)
    setFixResult(null)

    try {
      // Call the API route to create tables
      const response = await fetch("/api/db-init")
      const data = await response.json()

      if (data.success) {
        setFixResult({
          success: true,
          message: "Database tables have been created successfully",
        })
      } else {
        setFixResult({
          success: false,
          message: "Failed to create database tables. Please try again later.",
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
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>

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
      </CardContent>
      <CardFooter className="flex justify-between">
        {resetErrorBoundary && (
          <Button variant="outline" onClick={resetErrorBoundary}>
            Try Again
          </Button>
        )}

        <Button onClick={handleFixDatabase} disabled={isFixing}>
          {isFixing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Creating Tables...
            </>
          ) : (
            "Create Database Tables"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
