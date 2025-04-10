"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { ensureDatabaseTables, createHelperFunctions } from "@/lib/db-init"

export function DatabaseStatus() {
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState<{
    checked: boolean
    success: boolean
    message: string
    created?: string[]
  }>({
    checked: false,
    success: false,
    message: "Database status not checked yet",
  })

  const checkDatabase = async () => {
    setIsChecking(true)

    try {
      // First create helper functions
      await createHelperFunctions()

      // Then ensure all tables exist
      const result = await ensureDatabaseTables()

      if (result.success) {
        setStatus({
          checked: true,
          success: true,
          message:
            result.created && result.created.length > 0
              ? `Created missing tables: ${result.created.join(", ")}`
              : "All database tables are available",
          created: result.created,
        })
      } else {
        setStatus({
          checked: true,
          success: false,
          message: "Failed to check database tables. Please try again later.",
        })
      }
    } catch (error) {
      console.error("Error checking database:", error)
      setStatus({
        checked: true,
        success: false,
        message: "An unexpected error occurred while checking the database.",
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Check database on mount
  useEffect(() => {
    checkDatabase()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Status</CardTitle>
        <CardDescription>Check and fix database tables</CardDescription>
      </CardHeader>
      <CardContent>
        {status.checked ? (
          <Alert variant={status.success ? "default" : "destructive"}>
            {status.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{status.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        ) : (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={checkDatabase} disabled={isChecking} className="w-full">
          {isChecking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking Database...
            </>
          ) : (
            "Check Database Status"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
