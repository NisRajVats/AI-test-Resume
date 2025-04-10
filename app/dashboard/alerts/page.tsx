"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { createJobAlert, getJobAlerts, deleteJobAlert } from "@/app/actions/advanced-actions"
import { Bell, Plus, Trash2, Clock, Search } from "lucide-react"

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" },
]

export default function JobAlerts() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    jobTitle: "",
    location: "",
    keywords: "",
    frequency: "daily",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchAlerts = async () => {
      if (user) {
        const { data, error } = await getJobAlerts(user.id)
        if (!error && data) {
          setAlerts(data)
        }
      }
    }

    fetchAlerts()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCreateAlert = async () => {
    if (!formData.jobTitle) {
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
      const keywords = formData.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0)

      const { data, error } = await createJobAlert(
        user!.id,
        formData.jobTitle,
        formData.location || undefined,
        keywords.length > 0 ? keywords : undefined,
        formData.frequency,
      )

      if (error) throw error

      // Add the new alert to the state
      setAlerts([...alerts, data[0]])
      setIsDialogOpen(false)
      resetForm()

      toast({
        title: "Alert created",
        description: "Your job alert has been created successfully",
      })
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

  const handleDeleteAlert = async (id: string) => {
    try {
      const { error } = await deleteJobAlert(id)
      if (error) throw error

      // Remove the alert from the state
      setAlerts(alerts.filter((alert) => alert.id !== id))

      toast({
        title: "Alert deleted",
        description: "Your job alert has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting alert:", error)
      toast({
        title: "Error",
        description: "Failed to delete job alert",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      jobTitle: "",
      location: "",
      keywords: "",
      frequency: "daily",
    })
  }

  const getFrequencyLabel = (value: string) => {
    return frequencyOptions.find((option) => option.value === value)?.label || value
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Alerts</h1>
          <p className="text-muted-foreground">Get notified about new job opportunities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create Job Alert</DialogTitle>
              <DialogDescription>Set up notifications for new job opportunities</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. New York, Remote"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (Optional)</Label>
                <Input
                  id="keywords"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="e.g. React, Node.js, TypeScript"
                />
                <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Alert Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value) => handleSelectChange("frequency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAlert} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Alert"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Job Alerts</CardTitle>
            <CardDescription>Create your first job alert to get started</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              You haven't created any job alerts yet. Create your first alert to get notified about new job
              opportunities.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Alert
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{alert.job_title}</CardTitle>
                    {alert.location && <CardDescription>{alert.location}</CardDescription>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {alert.keywords && alert.keywords.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {alert.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{getFrequencyLabel(alert.frequency)} alerts</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    window.open(
                      `/dashboard/jobs?title=${encodeURIComponent(alert.job_title)}&location=${encodeURIComponent(alert.location || "")}`,
                      "_self",
                    )
                  }
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
