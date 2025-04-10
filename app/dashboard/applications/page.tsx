"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Plus, ExternalLink, Edit, Trash2, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { addApplication, updateApplication, deleteApplication, getApplications } from "@/app/actions/db-actions"

// Application status options
const statusOptions = [
  { value: "applied", label: "Applied", color: "bg-blue-500" },
  { value: "interviewing", label: "Interviewing", color: "bg-yellow-500" },
  { value: "offer", label: "Offer", color: "bg-green-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-slate-500" },
]

// Mock application data
const mockApplications = [
  {
    id: "1",
    company: "Tech Innovations Inc.",
    position: "Senior Frontend Developer",
    location: "New York, NY (Remote)",
    status: "applied",
    dateApplied: new Date("2025-03-15"),
    notes: "Applied through LinkedIn. Referral from John.",
    link: "https://www.linkedin.com/jobs/view/123456789",
  },
  {
    id: "2",
    company: "Global Solutions",
    position: "Full Stack Engineer",
    location: "San Francisco, CA",
    status: "interviewing",
    dateApplied: new Date("2025-03-10"),
    notes: "First interview scheduled for April 5th.",
    link: "https://www.indeed.com/viewjob?jk=abcdef123456",
  },
  {
    id: "3",
    company: "Startup Ventures",
    position: "React Developer",
    location: "Remote",
    status: "rejected",
    dateApplied: new Date("2025-03-05"),
    notes: "Received rejection email on March 20th.",
    link: "https://www.glassdoor.com/job-listing/123456",
  },
]

type Application = {
  id: string
  company: string
  position: string
  location: string
  status: string
  dateApplied: Date
  notes: string
  link: string
}

export default function ApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()
  const { user } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    location: "",
    status: "applied",
    dateApplied: new Date(),
    notes: "",
    link: "",
  })

  useEffect(() => {
    const fetchApplications = async () => {
      if (user) {
        const { data, error } = await getApplications(user.id)
        if (!error && data) {
          // Convert date strings to Date objects
          const formattedData = data.map((app) => ({
            ...app,
            id: app.id,
            company: app.company,
            position: app.position,
            location: app.location,
            status: app.status,
            dateApplied: new Date(app.date_applied),
            notes: app.notes,
            link: app.link,
          }))
          setApplications(formattedData)
        }
      }
    }

    fetchApplications()
  }, [user])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle date changes
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        dateApplied: date,
      })
    }
  }

  // Add new application
  const handleAddApplication = async () => {
    if (!user) return

    try {
      const { data, error } = await addApplication(user.id, formData)

      if (error) throw error

      if (data && data[0]) {
        const newApplication = {
          id: data[0].id,
          company: data[0].company,
          position: data[0].position,
          location: data[0].location,
          status: data[0].status,
          dateApplied: new Date(data[0].date_applied),
          notes: data[0].notes,
          link: data[0].link,
        }

        setApplications([newApplication, ...applications])
        setIsAddDialogOpen(false)
        resetForm()

        toast({
          title: "Application added",
          description: "Your job application has been added successfully",
        })
      }
    } catch (error) {
      console.error("Error adding application:", error)

      toast({
        title: "Error",
        description: "Failed to add application",
        variant: "destructive",
      })
    }
  }

  // Edit application
  const handleEditApplication = async () => {
    if (!currentApplication) return

    try {
      const { data, error } = await updateApplication(currentApplication.id, formData)

      if (error) throw error

      if (data && data[0]) {
        const updatedApplication = {
          id: data[0].id,
          company: data[0].company,
          position: data[0].position,
          location: data[0].location,
          status: data[0].status,
          dateApplied: new Date(data[0].date_applied),
          notes: data[0].notes,
          link: data[0].link,
        }

        const updatedApplications = applications.map((app) =>
          app.id === updatedApplication.id ? updatedApplication : app,
        )

        setApplications(updatedApplications)
        setIsEditDialogOpen(false)
        resetForm()

        toast({
          title: "Application updated",
          description: "Your job application has been updated successfully",
        })
      }
    } catch (error) {
      console.error("Error updating application:", error)

      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      })
    }
  }

  // Delete application
  const handleDeleteApplication = async (id: string) => {
    try {
      const { error } = await deleteApplication(id)

      if (error) throw error

      const updatedApplications = applications.filter((app) => app.id !== id)
      setApplications(updatedApplications)

      toast({
        title: "Application deleted",
        description: "Your job application has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting application:", error)

      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      })
    }
  }

  // Open edit dialog
  const openEditDialog = (application: Application) => {
    setCurrentApplication(application)
    setFormData({
      company: application.company,
      position: application.position,
      location: application.location,
      status: application.status,
      dateApplied: application.dateApplied,
      notes: application.notes,
      link: application.link,
    })
    setIsEditDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      company: "",
      position: "",
      location: "",
      status: "applied",
      dateApplied: new Date(),
      notes: "",
      link: "",
    })
    setCurrentApplication(null)
  }

  // Filter applications by status
  const filteredApplications =
    filterStatus === "all" ? applications : applications.filter((app) => app.status === filterStatus)

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find((option) => option.value === status)
    return <Badge className={`${statusOption?.color} hover:${statusOption?.color}`}>{statusOption?.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Tracker</h1>
          <p className="text-muted-foreground">Track and manage your job applications</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Application</DialogTitle>
              <DialogDescription>Enter the details of your job application</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="Job title"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, State or Remote"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateApplied">Date Applied</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateApplied ? format(formData.dateApplied, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dateApplied}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link">Job Link</Label>
                  <Input
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="URL to job posting"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any notes about the application"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddApplication}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Your Applications</CardTitle>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No applications found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filterStatus === "all"
                  ? "Start tracking your job applications by adding your first one"
                  : `No applications with status "${statusOptions.find((o) => o.value === filterStatus)?.label}"`}
              </p>
              {filterStatus !== "all" && (
                <Button variant="link" onClick={() => setFilterStatus("all")} className="mt-2">
                  View all applications
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.company}</TableCell>
                      <TableCell>{application.position}</TableCell>
                      <TableCell>{application.location}</TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell>{format(application.dateApplied, "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => window.open(application.link, "_blank")}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(application)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteApplication(application.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>Update the details of your job application</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input id="edit-company" name="company" value={formData.company} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Input id="edit-position" name="position" value={formData.position} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" name="location" value={formData.location} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dateApplied">Date Applied</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateApplied ? format(formData.dateApplied, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.dateApplied} onSelect={handleDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-link">Job Link</Label>
                <Input id="edit-link" name="link" value={formData.link} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" name="notes" value={formData.notes} onChange={handleInputChange} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditApplication}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
