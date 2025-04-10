"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, Search, LinkIcon, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { analyzeJobPosting } from "@/app/actions/ai-actions"

// Job portal definitions
const jobPortals = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "/placeholder.svg?height=24&width=24",
    searchUrlTemplate: "https://www.linkedin.com/jobs/search/?keywords={role}&location={location}",
  },
  {
    id: "indeed",
    name: "Indeed",
    icon: "/placeholder.svg?height=24&width=24",
    searchUrlTemplate: "https://www.indeed.com/jobs?q={role}&l={location}",
  },
  {
    id: "glassdoor",
    name: "Glassdoor",
    icon: "/placeholder.svg?height=24&width=24",
    searchUrlTemplate: "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={role}&locT=C&locId=0&locKeyword={location}",
  },
  {
    id: "naukri",
    name: "Naukri",
    icon: "/placeholder.svg?height=24&width=24",
    searchUrlTemplate: "https://www.naukri.com/{role}-jobs-in-{location}",
  },
]

export default function JobSearch() {
  const [jobRole, setJobRole] = useState("")
  const [location, setLocation] = useState("")
  const [selectedPortal, setSelectedPortal] = useState("linkedin")
  const [jobLink, setJobLink] = useState("")
  const [jobDetails, setJobDetails] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  // Generate search URL based on selected portal and inputs
  const generateSearchUrl = () => {
    const portal = jobPortals.find((p) => p.id === selectedPortal)
    if (!portal) return ""

    return portal.searchUrlTemplate
      .replace("{role}", encodeURIComponent(jobRole))
      .replace("{location}", encodeURIComponent(location))
  }

  // Handle job search redirection
  const handleSearch = () => {
    if (!jobRole || !location) {
      toast({
        title: "Missing information",
        description: "Please enter both job role and location",
        variant: "destructive",
      })
      return
    }

    const url = generateSearchUrl()
    window.open(url, "_blank")
  }

  // Handle job link analysis
  const handleAnalyzeJob = async () => {
    if (!jobLink) {
      toast({
        title: "Missing job link",
        description: "Please enter a job link to analyze",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      // In a real implementation, you would fetch the job description from the URL
      // For now, we'll use a mock job description
      const mockJobDescription = `
        Senior Frontend Developer
        
        Tech Innovations Inc. is seeking a Senior Frontend Developer to join our team in New York, NY. Remote work options available.
        
        Responsibilities:
        - Develop and maintain web applications using React and TypeScript
        - Collaborate with designers and backend developers
        - Optimize application performance
        - Mentor junior developers
        
        Requirements:
        - At least 5 years of experience in frontend development
        - Strong proficiency in React and TypeScript
        - Experience with state management libraries (Redux, MobX, etc.)
        - Knowledge of modern frontend build tools
        - Experience with responsive design and cross-browser compatibility
        
        Preferred Skills:
        - GraphQL
        - Next.js
        - Testing frameworks (Jest, React Testing Library)
        
        Salary Range: $120,000 - $150,000
      `

      // Get the user's resume if available (in a real app, you would fetch this from storage)
      // For now, we'll use a mock resume
      const mockResume = `
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

      const response = await analyzeJobPosting(mockJobDescription, mockResume)

      // Parse the response to extract structured data
      // In a real implementation, you would parse the AI response more robustly
      // For now, we'll use the mock data structure
      setJobDetails({
        title: "Senior Frontend Developer",
        company: "Tech Innovations Inc.",
        location: "New York, NY (Remote)",
        salary: "$120,000 - $150,000",
        description:
          "We are looking for a Senior Frontend Developer to join our team. The ideal candidate will have experience with React, TypeScript, and modern frontend development practices.",
        requirements: [
          "At least 5 years of experience in frontend development",
          "Strong proficiency in React and TypeScript",
          "Experience with state management libraries (Redux, MobX, etc.)",
          "Knowledge of modern frontend build tools",
          "Experience with responsive design and cross-browser compatibility",
        ],
        skills: ["React", "TypeScript", "JavaScript", "HTML/CSS", "Redux", "Webpack", "Jest"],
        matchScore: 85,
        missingSkills: ["GraphQL", "Next.js"],
      })

      toast({
        title: "Analysis complete",
        description: "Job details have been extracted successfully",
      })
    } catch (error) {
      console.error("Error analyzing job:", error)

      toast({
        title: "Error",
        description: "There was an error analyzing the job link",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Search</h1>
        <p className="text-muted-foreground">Search for jobs on popular job portals or analyze job listings</p>
      </div>

      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Jobs</TabsTrigger>
          <TabsTrigger value="analyze">Analyze Job Listing</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search for Jobs</CardTitle>
              <CardDescription>Enter job details and select a portal to search</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-role">Job Role</Label>
                <Input
                  id="job-role"
                  placeholder="e.g. Software Engineer, Product Manager"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. New York, Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Job Portal</Label>
                <RadioGroup value={selectedPortal} onValueChange={setSelectedPortal} className="grid grid-cols-2 gap-4">
                  {jobPortals.map((portal) => (
                    <div key={portal.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={portal.id} id={portal.id} />
                      <Label htmlFor={portal.id} className="flex items-center cursor-pointer">
                        <img src={portal.icon || "/placeholder.svg"} alt={portal.name} className="w-5 h-5 mr-2" />
                        {portal.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {jobRole && location && (
                <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3 text-sm">
                  <p className="font-medium">Preview URL:</p>
                  <p className="text-xs break-all text-muted-foreground mt-1">{generateSearchUrl()}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSearch} disabled={!jobRole || !location} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Search on {jobPortals.find((p) => p.id === selectedPortal)?.name}
              </Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Searches</CardTitle>
                <CardDescription>Your recent job searches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">No recent searches yet</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Portals</CardTitle>
                <CardDescription>Based on your profile and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobPortals.slice(0, 3).map((portal) => (
                    <div key={portal.id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <img src={portal.icon || "/placeholder.svg"} alt={portal.name} className="w-6 h-6 mr-2" />
                        <span>{portal.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            portal.searchUrlTemplate.replace("{role}", "").replace("{location}", ""),
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Job Listing</CardTitle>
              <CardDescription>Paste a job link to analyze requirements and match with your resume</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-link">Job Link</Label>
                <div className="flex space-x-2">
                  <Input
                    id="job-link"
                    placeholder="e.g. https://www.linkedin.com/jobs/view/123456789"
                    value={jobLink}
                    onChange={(e) => setJobLink(e.target.value)}
                  />
                  <Button onClick={handleAnalyzeJob} disabled={!jobLink || isAnalyzing}>
                    {isAnalyzing ? "Analyzing..." : "Analyze"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {jobDetails && (
            <Card>
              <CardHeader>
                <CardTitle>{jobDetails.title}</CardTitle>
                <CardDescription>
                  {jobDetails.company} • {jobDetails.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm">Estimated Salary</h3>
                  <p>{jobDetails.salary}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Description</h3>
                  <p className="text-sm">{jobDetails.description}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Requirements</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                    {jobDetails.requirements.map((req: string, index: number) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Required Skills</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {jobDetails.skills.map((skill: string, index: number) => (
                      <div
                        key={index}
                        className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-3 py-1 rounded-full text-xs"
                      >
                        {skill}
                      </div>
                    ))}
                    {jobDetails.missingSkills.map((skill: string, index: number) => (
                      <div
                        key={index}
                        className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-3 py-1 rounded-full text-xs"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Match Score</h3>
                    <span className="text-lg font-bold">{jobDetails.matchScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: `${jobDetails.matchScore}%` }}
                    ></div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {jobDetails.missingSkills.map((skill: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs"
                        >
                          {skill}
                          <ArrowRight className="h-3 w-3 ml-1 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => window.open(jobLink, "_blank")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Original
                </Button>
                <Button>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Track Application
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
