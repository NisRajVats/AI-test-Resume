"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { analyzeResume } from "@/app/actions/ai-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResumeUpload } from "@/components/resume-upload"
import { ResumeOptimizer } from "@/components/resume-optimizer"
import { CompanyInsights } from "@/components/company-insights"
import { JobAlertsSetup } from "@/components/job-alerts-setup"
import { cleanupOldUploads } from "@/utils/file-handler"
import { getUserResume } from "@/app/actions/resume-actions"
import dynamic from "next/dynamic"

// Lazy load components
const ResumeScoreComponent = dynamic(() => import("@/components/resume-score-component"), {
  loading: () => <div className="h-64 flex items-center justify-center">Loading Resume Score...</div>,
  ssr: false,
})

// Add a type for the resume data
interface ResumeData {
  skills: string[]
  experience: {
    title: string
    company: string
    duration: string
    description: string
  }[]
  education: {
    degree: string
    institution: string
    year: string
  }[]
  suggestions: string[]
  optimizedVersionA: string
  optimizedVersionB: string
}

export default function ResumePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userResume, setUserResume] = useState<any>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Clean up old uploads on component mount
  useEffect(() => {
    cleanupOldUploads(30) // Clean up uploads older than 30 days
  }, [])

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope)
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })
    }
  }, [])

  // Fetch user's resume
  useEffect(() => {
    const fetchResume = async () => {
      if (user) {
        const { data, error } = await getUserResume(user.id)
        if (!error && data) {
          setUserResume(data)
        }
      }
    }

    fetchResume()
  }, [user])

  const handleUploadComplete = async (url: string) => {
    if (!user) return

    setIsAnalyzing(true)
    setError(null)

    try {
      // In a real implementation, you would extract text from the PDF/DOCX here
      // For now, we'll use a mock resume text
      const mockResumeText = `
        John Doe
        Software Engineer
        New York, NY | john.doe@example.com | (123) 456-7890
        
        EXPERIENCE
        Senior Frontend Developer, Tech Company
        January 2020 - Present
        - Developed and maintained web applications using React and TypeScript
        - Improved application performance by 30% through code optimization
        - Led a team of 3 developers on a major feature release
        
        Junior Developer, Startup Inc
        June 2018 - December 2019
        - Worked on various frontend and backend projects using JavaScript and Node.js
        - Implemented responsive designs using HTML/CSS
        
        EDUCATION
        Bachelor of Science in Computer Science
        University Name, 2018
        
        SKILLS
        JavaScript, React, TypeScript, Node.js, HTML/CSS, Git
      `

      // Set a timeout to simulate processing time
      const startTime = performance.now()

      const response = await analyzeResume(mockResumeText)

      // Ensure minimum processing time of 1 second for UX
      const processingTime = performance.now() - startTime
      if (processingTime < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - processingTime))
      }

      // Parse the AI response to extract structured data
      // In a real implementation, you would parse this more robustly
      // For now, we'll use the mock data structure
      setResumeData({
        skills: ["JavaScript", "React", "Node.js", "TypeScript", "HTML/CSS"],
        experience: [
          {
            title: "Frontend Developer",
            company: "Tech Company",
            duration: "Jan 2020 - Present",
            description: "Developed and maintained web applications using React and TypeScript.",
          },
          {
            title: "Junior Developer",
            company: "Startup Inc",
            duration: "Jun 2018 - Dec 2019",
            description: "Worked on various frontend and backend projects using JavaScript and Node.js.",
          },
        ],
        education: [
          {
            degree: "Bachelor of Science in Computer Science",
            institution: "University Name",
            year: "2018",
          },
        ],
        suggestions: [
          "Quantify your achievements with metrics",
          "Add more keywords relevant to your target job",
          "Improve the structure of your work experience section",
          "Add a professional summary at the top",
        ],
        optimizedVersionA: "This is the first optimized version of your resume...",
        optimizedVersionB: "This is the second optimized version with different emphasis...",
      })

      toast({
        title: "Analysis complete",
        description: "Your resume has been analyzed successfully",
      })

      // Refresh user resume data
      const { data } = await getUserResume(user.id)
      if (data) {
        setUserResume(data)
      }
    } catch (error) {
      console.error("Error analyzing resume:", error)
      setError("There was an error analyzing your resume. Please try again.")

      toast({
        title: "Error",
        description: "There was an error analyzing your resume",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume Optimizer</h1>
        <p className="text-muted-foreground">Upload your resume to get AI-powered optimization suggestions</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!resumeData ? (
        <ResumeUpload onUploadComplete={handleUploadComplete} />
      ) : (
        <Tabs defaultValue="analysis">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="version-a">Version A</TabsTrigger>
            <TabsTrigger value="version-b">Version B</TabsTrigger>
            <TabsTrigger value="optimize">Job Optimizer</TabsTrigger>
            <TabsTrigger value="insights">Company Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>Skills extracted from your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {resumeData?.skills?.map((skill: string, index: number) => (
                    <div key={index} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Experience</CardTitle>
                <CardDescription>Work experience extracted from your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resumeData?.experience?.map((exp: any, index: number) => (
                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                      <h3 className="font-medium">{exp.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {exp.company} | {exp.duration}
                      </p>
                      <p className="text-sm mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>Education details extracted from your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resumeData?.education?.map((edu: any, index: number) => (
                    <div key={index}>
                      <h3 className="font-medium">{edu.degree}</h3>
                      <p className="text-sm text-muted-foreground">
                        {edu.institution} | {edu.year}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Suggestions</CardTitle>
                <CardDescription>AI-powered suggestions to improve your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {resumeData?.suggestions?.map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-primary" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Get More Suggestions
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="version-a">
            <Card>
              <CardHeader>
                <CardTitle>Optimized Version A</CardTitle>
                <CardDescription>First optimized version of your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 min-h-[400px]">{resumeData?.optimizedVersionA}</div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download as PDF
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="version-b">
            <Card>
              <CardHeader>
                <CardTitle>Optimized Version B</CardTitle>
                <CardDescription>Alternative optimized version with different emphasis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 min-h-[400px]">{resumeData?.optimizedVersionB}</div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download as PDF
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="optimize" className="space-y-4">
            <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading Optimizer...</div>}>
              {userResume && <ResumeOptimizer resumeId={userResume.id} />}
              {!userResume && (
                <Card>
                  <CardHeader>
                    <CardTitle>No Resume Found</CardTitle>
                    <CardDescription>Please upload a resume first</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-center text-muted-foreground">
                      You need to upload a resume before you can optimize it for specific jobs.
                    </p>
                  </CardContent>
                </Card>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading Insights...</div>}>
              <CompanyInsights />
            </Suspense>

            <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading Job Alerts...</div>}>
              <JobAlertsSetup />
            </Suspense>
          </TabsContent>
        </Tabs>
      )}

      {resumeData && (
        <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading Resume Score...</div>}>
          <ResumeScoreComponent resumeId={userResume?.id} />
        </Suspense>
      )}
    </div>
  )
}
