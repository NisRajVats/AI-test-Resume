"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { logError, ErrorType, ErrorSeverity } from "@/utils/error-handler"

export default function SignUp() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [dataRetentionAccepted, setDataRetentionAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signUp } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate form
    if (!termsAccepted || !dataRetentionAccepted) {
      setError("You must accept the terms of service and data retention policy")
      setIsLoading(false)
      return
    }

    try {
      await signUp(email, password, name)

      // Save consent data
      localStorage.setItem(
        "user-consent-data",
        JSON.stringify({
          termsAccepted: true,
          dataRetentionAccepted: true,
          timestamp: new Date().toISOString(),
        }),
      )

      toast({
        title: "Account created",
        description: "Please check your email to confirm your account",
      })
    } catch (error: any) {
      console.error("Signup error:", error)

      // Provide a more user-friendly message for duplicate emails
      let errorMessage = error?.message || "There was an error signing up. Please try again."

      if (error?.message?.includes("duplicate key value") || error?.message?.includes("already registered")) {
        errorMessage = "This email is already registered. Please try logging in instead."
      }

      // Log the error
      logError(ErrorType.AUTHENTICATION, "Signup failed", ErrorSeverity.MEDIUM, { email }, error)

      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="h-auto p-0 ml-1">
                          terms of service
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Terms of Service</DialogTitle>
                          <DialogDescription>Last updated: April 5, 2025</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 text-sm">
                          <h3 className="font-medium">1. Introduction</h3>
                          <p>Welcome to AI Resume Optimizer. By using our service, you agree to these terms.</p>

                          <h3 className="font-medium">2. Privacy and Data</h3>
                          <p>
                            We collect and process your data as described in our Privacy Policy. Your resume data is
                            used only for the purpose of providing our services.
                          </p>

                          <h3 className="font-medium">3. User Accounts</h3>
                          <p>
                            You are responsible for maintaining the confidentiality of your account credentials and for
                            all activities under your account.
                          </p>

                          {/* More terms would go here */}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="data-retention"
                  checked={dataRetentionAccepted}
                  onCheckedChange={(checked) => setDataRetentionAccepted(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="data-retention"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I understand that my resume data will be automatically deleted after 30 days unless I opt to save it
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading || !termsAccepted || !dataRetentionAccepted}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
