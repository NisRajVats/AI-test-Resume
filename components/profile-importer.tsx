"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Link } from "lucide-react"
import { importProfileFromUrl } from "@/app/actions/profile-import-actions"

export function ProfileImporter() {
  const [profileUrl, setProfileUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to use this feature",
        variant: "destructive",
      })
      return
    }

    if (!profileUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a profile URL",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    if (!profileUrl.startsWith("http")) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await importProfileFromUrl(user.id, profileUrl)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setProfileUrl("")

        // Refresh the page to show updated profile
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error importing profile:", error)
      toast({
        title: "Error",
        description: "Failed to import profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Link className="mr-2 h-5 w-5" />
          Import Profile
        </CardTitle>
        <CardDescription>Import your profile from LinkedIn, Indeed, or Glassdoor</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-2">
            <Input
              placeholder="https://www.linkedin.com/in/yourprofile"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Paste your profile URL from LinkedIn, Indeed, or Glassdoor</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Importing..." : "Import Profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
