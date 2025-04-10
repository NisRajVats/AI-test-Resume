"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getApplications } from "@/app/actions/db-actions"
import { generateFollowUpEmail, getFollowUps, markFollowUpAsSent } from "@/app/actions/advanced-actions"
import { Mail, Calendar, Copy, CheckCircle, Send, Clock } from "lucide-react"

export default function FollowUpGenerator() {
  const [applications, setApplications] = useState<any[]>([])
  const [followUps, setFollowUps] = useState<any[]>([])
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [generatedEmail, setGeneratedEmail] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        // Fetch applications
        const { data: applicationsData, error: applicationsError } = await getApplications(user.id)
        if (!applicationsError && applicationsData) {
          setApplications(applicationsData)
        }

        // Fetch follow-ups
        const { data: followUpsData, error: followUpsError } = await getFollowUps(user.id)
        if (!followUpsError && followUpsData) {
          setFollowUps(followUpsData)
        }
      }
    }

    fetchData()
  }, [user])

  const handleGenerateEmail = async (application: any) => {
    setSelectedApplication(application)
    setIsGenerating(true)

    try {
      const result = await generateFollowUpEmail(user!.id, application.id, {
        company: application.company,
        position: application.position,
        dateApplied: application.date_applied,
        status: application.status,
        notes: application.notes,
      })

      if (result.error) throw new Error("Failed to generate follow-up email")

      setGeneratedEmail(result)

      // Refresh follow-ups list
      const { data, error } = await getFollowUps(user!.id)
      if (!error && data) {
        setFollowUps(data)
      }

      toast({
        title: "Email generated",
        description: "Your follow-up email has been generated successfully",
      })
    } catch (error) {
      console.error("Error generating email:", error)
      toast({
        title: "Error",
        description: "Failed to generate follow-up email",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMarkAsSent = async (followUpId: string) => {
    try {
      const { error } = await markFollowUpAsSent(followUpId)
      if (error) throw error

      // Update the follow-up in the state
      setFollowUps(followUps.map((followUp) => (followUp.id === followUpId ? { ...followUp, sent: true } : followUp)))

      toast({
        title: "Marked as sent",
        description: "The follow-up has been marked as sent",
      })
    } catch (error) {
      console.error("Error marking as sent:", error)
      toast({
        title: "Error",
        description: "Failed to mark follow-up as sent",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Email copied to clipboard",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      applied: "bg-blue-500",
      interviewing: "bg-yellow-500",
      offer: "bg-green-500",
      rejected: "bg-red-500",
      withdrawn: "bg-slate-500",
    }
    return <Badge className={`${statusColors[status] || "bg-slate-500"}`}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Follow-Up Generator</h1>
        <p className="text-muted-foreground">Generate professional follow-up emails for your job applications</p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Follow-Up</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Follow-Ups</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {generatedEmail ? (
            <Card>
              <CardHeader>
                <CardTitle>Generated Follow-Up Email</CardTitle>
                <CardDescription>
                  For {selectedApplication.position} at {selectedApplication.company}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-medium">Subject: Follow-Up: {selectedApplication.position} Application</p>
                        <p className="text-sm text-muted-foreground">To: {selectedApplication.company} Hiring Team</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedEmail.email)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="whitespace-pre-line">{generatedEmail.email}</div>
                    </ScrollArea>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Scheduled for</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(generatedEmail.scheduledDate), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleMarkAsSent(generatedEmail.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Sent
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setGeneratedEmail(null)}>
                  Back
                </Button>
                <Button
                  onClick={() =>
                    window.open(
                      `mailto:?subject=Follow-Up: ${selectedApplication.position} Application&body=${encodeURIComponent(generatedEmail.email)}`,
                    )
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Select Application</CardTitle>
                <CardDescription>Choose an application to generate a follow-up email</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Mail className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-center text-muted-foreground">
                      You haven't added any job applications yet. Add an application first to generate a follow-up
                      email.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="flex justify-between items-center rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{application.position}</p>
                          <p className="text-sm text-muted-foreground">{application.company}</p>
                          <div className="flex items-center mt-1 space-x-2">
                            {getStatusBadge(application.status)}
                            <span className="text-xs text-muted-foreground">
                              Applied on {format(new Date(application.date_applied), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <Button onClick={() => handleGenerateEmail(application)} disabled={isGenerating}>
                          {isGenerating && selectedApplication?.id === application.id ? "Generating..." : "Generate"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {applications.length === 0 && (
                <CardFooter>
                  <Button className="w-full" onClick={() => window.open("/dashboard/applications", "_self")}>
                    Add Application
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Follow-Ups</CardTitle>
              <CardDescription>Manage your scheduled follow-up emails</CardDescription>
            </CardHeader>
            <CardContent>
              {followUps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">
                    You don't have any scheduled follow-ups yet. Generate a follow-up email to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followUps.map((followUp) => (
                    <div key={followUp.id} className="rounded-lg border p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {followUp.applications.position} at {followUp.applications.company}
                          </p>
                          <div className="flex items-center mt-1 space-x-2">
                            {getStatusBadge(followUp.applications.status)}
                            <span className="text-xs text-muted-foreground">
                              Scheduled for {format(new Date(followUp.scheduled_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <Badge variant={followUp.sent ? "outline" : "secondary"}>
                          {followUp.sent ? "Sent" : "Pending"}
                        </Badge>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(followUp.content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Email
                        </Button>
                        {!followUp.sent && (
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleMarkAsSent(followUp.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Sent
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `mailto:?subject=Follow-Up: ${followUp.applications.position} Application&body=${encodeURIComponent(followUp.content)}`,
                                )
                              }
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Tips</CardTitle>
              <CardDescription>Best practices for following up on job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Timing is key</p>
                    <p className="text-sm text-muted-foreground">
                      Wait 1-2 weeks after applying before sending your first follow-up. For interviews, send a
                      thank-you email within 24 hours.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-3 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Keep it concise</p>
                    <p className="text-sm text-muted-foreground">
                      Hiring managers are busy. Keep your follow-up emails brief, professional, and to the point.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-3 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Add value</p>
                    <p className="text-sm text-muted-foreground">
                      Include something new in your follow-up, such as a relevant accomplishment or article that
                      demonstrates your expertise.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
