"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getUserResumes } from "@/app/actions/db-actions"
import { generateResumeScore, getIndustryBenchmarks } from "@/app/actions/advanced-actions"
import { FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function ResumeScore() {
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedResume, setSelectedResume] = useState<string>("")
  const [jobTitle, setJobTitle] = useState<string>("")
  const [industry, setIndustry] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [scoreData, setScoreData] = useState<any>(null)
  const [benchmarkData, setBenchmarkData] = useState<any>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchResumes = async () => {
      if (user) {
        const { data, error } = await getUserResumes(user.id)
        if (!error && data) {
          setResumes(data)
        }
      }
    }

    fetchResumes()
  }, [user])

  const handleGenerateScore = async () => {
    if (!selectedResume || !jobTitle || !industry) {
      toast({
        title: "Missing information",
        description: "Please select a resume and enter job title and industry",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // In a real implementation, you would extract text from the resume file
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

      const resumeId = selectedResume
      const result = await generateResumeScore(user!.id, resumeId, mockResumeText, jobTitle, industry)

      if (result.error) {
        throw new Error("Failed to generate resume score")
      }

      setScoreData(result)

      // Get industry benchmarks
      const benchmarkResult = await getIndustryBenchmarks(industry, jobTitle)
      if (!benchmarkResult.error) {
        setBenchmarkData(benchmarkResult.data)
      }

      toast({
        title: "Score generated",
        description: "Your resume has been scored successfully",
      })
    } catch (error) {
      console.error("Error generating score:", error)
      toast({
        title: "Error",
        description: "Failed to generate resume score",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (resumes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume Score</h1>
          <p className="text-muted-foreground">Get an ATS compatibility score for your resume</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Resumes Found</CardTitle>
            <CardDescription>Upload a resume first to get a score</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">You need to upload a resume before you can get a score</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/dashboard/resume")}>
              Upload Resume
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume Score</h1>
        <p className="text-muted-foreground">Get an ATS compatibility score for your resume</p>
      </div>

      {!scoreData ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate Resume Score</CardTitle>
            <CardDescription>Select a resume and enter job details to get a score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume">Select Resume</Label>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.file_name.split("/").pop()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Technology"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateScore}
              disabled={!selectedResume || !jobTitle || !industry || isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating..." : "Generate Score"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Tabs defaultValue="score">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="score">Score</TabsTrigger>
            <TabsTrigger value="benchmark">Industry Benchmark</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
          </TabsList>

          <TabsContent value="score" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resume Score</CardTitle>
                <CardDescription>
                  Score for {jobTitle} in {industry} industry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative h-40 w-40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold">{scoreData.overall_score}</span>
                    </div>
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-primary"
                        strokeWidth="10"
                        strokeDasharray={`${(scoreData.overall_score / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Overall Score</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>ATS Compatibility</Label>
                      <span className="text-sm font-medium">{scoreData.ats_score}/100</span>
                    </div>
                    <Progress value={scoreData.ats_score} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Content Quality</Label>
                      <span className="text-sm font-medium">{scoreData.content_score}/100</span>
                    </div>
                    <Progress value={scoreData.content_score} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Formatting</Label>
                      <span className="text-sm font-medium">{scoreData.format_score}/100</span>
                    </div>
                    <Progress value={scoreData.format_score} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Keyword Optimization</Label>
                      <span className="text-sm font-medium">{scoreData.keyword_score}/100</span>
                    </div>
                    <Progress value={scoreData.keyword_score} className="h-2" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setScoreData(null)}>
                  Generate New Score
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strengths</CardTitle>
                <CardDescription>What your resume does well</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scoreData.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weaknesses</CardTitle>
                <CardDescription>Areas for improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scoreData.weaknesses.map((weakness: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <XCircle className="mr-2 h-5 w-5 text-red-500 shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmark" className="space-y-4">
            {benchmarkData ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Industry Benchmark</CardTitle>
                    <CardDescription>
                      Average scores for {jobTitle} in {industry} industry
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>ATS Compatibility</Label>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{benchmarkData.avg_ats_score}/100</span>
                            <span className="text-xs text-muted-foreground">(Your score: {scoreData.ats_score})</span>
                          </div>
                        </div>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-slate-400 dark:bg-slate-500 h-2 rounded-full"
                                style={{ width: `${benchmarkData.avg_ats_score}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${scoreData.ats_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Content Quality</Label>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{benchmarkData.avg_content_score}/100</span>
                            <span className="text-xs text-muted-foreground">
                              (Your score: {scoreData.content_score})
                            </span>
                          </div>
                        </div>
                        <div className="relative pt-1">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-slate-400 dark:bg-slate-500 h-2 rounded-full"
                              style={{ width: `${benchmarkData.avg_content_score}%` }}
                            ></div>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${scoreData.content_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Overall Score</Label>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{benchmarkData.avg_overall_score}/100</span>
                            <span className="text-xs text-muted-foreground">
                              (Your score: {scoreData.overall_score})
                            </span>
                          </div>
                        </div>
                        <div className="relative pt-1">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-slate-400 dark:bg-slate-500 h-2 rounded-full"
                              style={{ width: `${benchmarkData.avg_overall_score}%` }}
                            ></div>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${scoreData.overall_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Required Skills</CardTitle>
                    <CardDescription>Skills typically required for this role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {benchmarkData.required_skills.map((skill: string, index: number) => (
                        <div key={index} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferred Skills</CardTitle>
                    <CardDescription>Skills that give you an advantage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {benchmarkData.preferred_skills.map((skill: string, index: number) => (
                        <div key={index} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Industry Benchmark</CardTitle>
                  <CardDescription>Benchmark data not available</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">
                    Industry benchmark data is not available for this job title and industry
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      const result = await getIndustryBenchmarks(industry, jobTitle)
                      if (!result.error) {
                        setBenchmarkData(result.data)
                      }
                    }}
                  >
                    Generate Benchmark Data
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="improvements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Improvement Tips</CardTitle>
                <CardDescription>Actionable suggestions to improve your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {scoreData.improvement_tips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p>{tip}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => router.push("/dashboard/resume")}>
                  Update Resume
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
