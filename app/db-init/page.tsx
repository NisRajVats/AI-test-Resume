"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export default function DbInitPage() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setResult(null)

    try {
      const response = await fetch("/api/db-init")
      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: "Database tables have been created successfully",
        })
      } else {
        setResult({
          success: false,
          message: "Failed to create database tables. Please try again later.",
        })
      }
    } catch (error) {
      console.error("Error initializing database:", error)
      setResult({
        success: false,
        message: "An unexpected error occurred while initializing the database.",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  // Initialize database on mount
  useEffect(() => {
    initializeDatabase()
  }, [])

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Database Initialization</CardTitle>
          <CardDescription>Create required database tables</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex justify-center py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={initializeDatabase} disabled={isInitializing} className="w-full">
            {isInitializing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Initializing Database...
              </>
            ) : (
              "Reinitialize Database"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
