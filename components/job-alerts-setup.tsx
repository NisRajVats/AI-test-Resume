"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Bell } from "lucide-react"
import { createJobAlert } from "@/app/actions/advanced-actions"

export function JobAlertsSetup() {
  const [jobTitle, setJobTitle] = useState("")
  const [location, setLocation] = useState("")
  const [keywords, setKeywords] = useState("")
  const [frequency, setFrequency] = useState("daily")
  const [isRealTime, setIsRealTime] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to use this feature",
        variant: "destructive",
      })
      return
    }

    if (!jobTitle) {
      toast({
        title: "Missing information",
        description: "Please enter a job title",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Parse keywords into array
      const keywordsArray = keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0)

      const { data, error } = await createJobAlert(
        user.id,
        jobTitle,
        location || undefined,
        keywordsArray.length > 0 ? keywordsArray : undefined,
        isRealTime ? "realtime" : frequency,
      )

      if (error) throw error

      toast({
        title: "Alert created",
        description: "Your job alert has been created successfully",
      })

      // Reset form
      setJobTitle("")
      setLocation("")
      setKeywords("")
      setFrequency("daily")
      setIsRealTime(false)
    } catch (error) {
      console.error("Error creating alert:", error)
      toast({
        title: "Error",
        description: "Failed to create job alert",
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
          <Bell className="mr-2 h-5 w-5" />
          Real-Time Job Alerts
        </CardTitle>
        <CardDescription>Get notified when new jobs matching your criteria are posted</CardDescription>
      </CardHeader>
      <form onSubmit={handleCreateAlert}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job Title</Label>
            <Input
              id="job-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Frontend Developer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, Remote"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (Optional)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. React, Node.js, TypeScript"
            />
            <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="real-time">Real-Time Notifications</Label>
              <Switch id="real-time" checked={isRealTime} onCheckedChange={setIsRealTime} />
            </div>

            {!isRealTime && (
              <div className="space-y-2">
                <Label htmlFor="frequency">Alert Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating Alert..." : "Create Job Alert"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
