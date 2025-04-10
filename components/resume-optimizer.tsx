"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { optimizeResumeForJobPosting } from "@/app/actions/resume-actions"
import { Loader2, FileText, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ResumeOptimizer({ resumeId }: { resumeId: string }) {
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedResume, setOptimizedResume] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to use this feature",
        variant: "destructive",
      })
      return
    }

    if (!jobTitle || !company || !jobDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsOptimizing(true)

    try {
      const result = await optimizeResumeForJobPosting(user.id, resumeId, jobDescription, jobTitle, company)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your resume has been optimized for this job",
        })
        setOptimizedResume(result.optimizedResume)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to optimize resume",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error optimizing resume:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5" />
          AI Resume Optimizer
        </CardTitle>
        <CardDescription>Automatically optimize your resume for a specific job posting</CardDescription>
      </CardHeader>

      {optimizedResume ? (
        <Tabs defaultValue="optimized">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="optimized">Optimized Resume</TabsTrigger>
            <TabsTrigger value="form">Optimize for Another Job</TabsTrigger>
          </TabsList>

          <TabsContent value="optimized">
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-medium">{jobTitle}</h3>
                    <p className="text-sm text-muted-foreground">{company}</p>
                  </div>
                </div>
                <div className="whitespace-pre-line">{optimizedResume}</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => window.print()}>
                <FileText className="mr-2 h-4 w-4" />
                Download as PDF
              </Button>
            </CardFooter>
          </TabsContent>

          <TabsContent value="form">
            <form onSubmit={handleOptimize}>
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
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Inc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-description">Job Description</Label>
                  <Textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here"
                    rows={6}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isOptimizing} className="w-full">
                  {isOptimizing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    "Optimize Resume"
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      ) : (
        <form onSubmit={handleOptimize}>
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
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Inc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here"
                rows={6}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isOptimizing} className="w-full">
              {isOptimizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                "Optimize Resume"
              )}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
