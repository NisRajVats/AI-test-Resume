"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DatabaseFallbackProps {
  error: Error | string
  resetErrorBoundary?: () => void
  title?: string
  description?: string
}

export function DatabaseFallback({
  error,
  resetErrorBoundary,
  title = "Database Connection Error",
  description = "There was an error connecting to the database",
}: DatabaseFallbackProps) {
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const errorMessage = typeof error === "string" ? error : error.message

  const handleFixDatabase = async () => {
    setIsFixing(true)
    setFixResult(null)

    try {
      // Call the API to initialize the database
      const response = await fetch("/api/db/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setFixResult({
          success: true,
          message: data.message || "Database initialized successfully",
        })

        toast({
          title: "Success",
          description: "Database connection has been fixed",
        })

        // Reload the page after a short delay
        setTimeout(() => {
          if (resetErrorBoundary) {
            resetErrorBoundary()
          } else {
            window.location.reload()
          }
        }, 2000)
      } else {
        setFixResult({
          success: false,
          message: data.message || "Failed to initialize database",
        })

        toast({
          title: "Error",
          description: "Failed to fix database connection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fixing database:", error)

      setFixResult({
        success: false,
        message: "An unexpected error occurred while fixing the database",
      })

      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  const handleCheckHealth = async () => {
    try {
      const response = await fetch("/api/db/health")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Database Health",
          description: `Supabase: ${data.supabase ? "✅" : "❌"}, Redis: ${data.redis ? "✅" : "❌"}, Postgres: ${data.postgres ? "✅" : "❌"}`,
        })
      } else {
        toast({
          title: "Database Health Check Failed",
          description: data.message || "Failed to check database health",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check database health",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>

        {fixResult && (
          <Alert variant={fixResult.success ? "default" : "destructive"}>
            {fixResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{fixResult.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{fixResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p>This error could be due to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Missing database tables</li>
            <li>Connection issues with the database</li>
            <li>Incorrect environment variables</li>
            <li>Temporary service outage</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button onClick={handleFixDatabase} disabled={isFixing || (fixResult?.success ?? false)} className="w-full">
          {isFixing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Fixing Database...
            </>
          ) : fixResult?.success ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Database Fixed
            </>
          ) : (
            "Fix Database Issues"
          )}
        </Button>

        <Button variant="outline" onClick={handleCheckHealth} className="w-full">
          Check Database Health
        </Button>
      </CardFooter>
    </Card>
  )
}
