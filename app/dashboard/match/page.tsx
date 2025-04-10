"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { calculateJobMatchScore } from "@/app/actions/advanced-actions"
import { Percent, CheckCircle, XCircle, ArrowRight } from "lucide-react"

export default function JobMatchScore() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    company: "",
    location: "",
    jobDescription: "",
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [matchData, setMatchData] = useState<any>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCalculateMatch = async () => {
    if (!formData.jobTitle || !formData.company || !formData.jobDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsCalculating(true)

    try {
      // In a real implementation, you would extract text from the user's resume
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

      const result = await calculateJobMatchScore(
        user!.id,
        mockResumeText,
        formData.jobDescription,
        formData.jobTitle,
        formData.company,
        formData.location || undefined,
      )

      if (result.error) {
        throw new Error("Failed to calculate job match score")
      }

      setMatchData(result)

      toast({
        title: "Match calculated",
        description: "Your job match score has been calculated",
      })
    } catch (error) {
      console.error("Error calculating match:", error)
      toast({
        title: "Error",
        description: "Failed to calculate job match score",
        variant: "destructive",
      })
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Match Score</h1>
        <p className="text-muted-foreground">Calculate how well your profile matches a job description</p>
      </div>

      {!matchData ? (
        <Card>
          <CardHeader>
            <CardTitle>Calculate Match Score</CardTitle>
            <CardDescription>Enter job details to calculate your match score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="e.g. Tech Innovations Inc."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. New York, NY or Remote"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleInputChange}
                placeholder="Paste the full job description here"
                rows={10}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleCalculateMatch}
              disabled={!formData.jobTitle || !formData.company || !formData.jobDescription || isCalculating}
              className="w-full"
            >
              {isCalculating ? "Calculating..." : "Calculate Match"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Tabs defaultValue="score">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="score">Match Score</TabsTrigger>
            <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
          </TabsList>

          <TabsContent value="score" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Match Score</CardTitle>
                <CardDescription>
                  {formData.jobTitle} at {formData.company}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative h-40 w-40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold">{matchData.match_score}%</span>
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
                        strokeDasharray={`${(matchData.match_score / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Overall Match Score</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Recommendation</p>
                      <p className="text-sm text-muted-foreground">Based on your match score</p>
                    </div>
                    <Badge
                      className={
                        matchData.match_score >= 70
                          ? "bg-green-500"
                          : matchData.match_score >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }
                    >
                      {matchData.match_score >= 70
                        ? "Strong Match"
                        : matchData.match_score >= 50
                          ? "Potential Match"
                          : "Low Match"}
                    </Badge>
                  </div>
                  <p className="text-sm">{matchData.recommendation}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setMatchData(null)}>
                  Calculate New Match
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strengths</CardTitle>
                <CardDescription>Your strengths for this position</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {matchData.strengths.map((strength: string, index: number) => (
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
                  {matchData.weaknesses.map((weakness: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <XCircle className="mr-2 h-5 w-5 text-red-500 shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skills Analysis</CardTitle>
                <CardDescription>Matching and missing skills for this position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Matching Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchData.skills_match.map((skill: string, index: number) => (
                      <div
                        key={index}
                        className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchData.skills_missing.map((skill: string, index: number) => (
                      <div
                        key={index}
                        className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Skill Gap Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on the job requirements, here are the skills you should focus on developing:
                  </p>
                  <div className="space-y-3">
                    {matchData.skills_missing.slice(0, 3).map((skill: string, index: number) => (
                      <div key={index} className="flex items-center">
                        <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{skill}</p>
                          <p className="text-xs text-muted-foreground">
                            {index === 0
                              ? "High priority - mentioned multiple times in the job description"
                              : index === 1
                                ? "Medium priority - important for this role"
                                : "Consider learning this skill to improve your match"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Recommendation</CardTitle>
                <CardDescription>Should you apply for this position?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center mb-4">
                    <Percent className="h-8 w-8 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">Match Score: {matchData.match_score}%</p>
                      <p className="text-sm text-muted-foreground">
                        {matchData.match_score >= 70
                          ? "Strong match - You're a great fit for this role"
                          : matchData.match_score >= 50
                            ? "Potential match - You meet many of the requirements"
                            : "Low match - This role may not be the best fit"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Recommendation:</p>
                    <p>{matchData.recommendation}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-3">Next Steps</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        1
                      </div>
                      <div>
                        <p className="font-medium">
                          {matchData.match_score >= 50 ? "Tailor your resume" : "Develop missing skills"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {matchData.match_score >= 50
                            ? "Customize your resume to highlight the matching skills and address the missing ones"
                            : "Focus on acquiring the key skills identified in the skills gap analysis"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        2
                      </div>
                      <div>
                        <p className="font-medium">
                          {matchData.match_score >= 70
                            ? "Apply with confidence"
                            : matchData.match_score >= 50
                              ? "Apply with a strong cover letter"
                              : "Look for more suitable roles"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {matchData.match_score >= 70
                            ? "You're a strong candidate for this position"
                            : matchData.match_score >= 50
                              ? "Address your strengths and how you plan to overcome skill gaps"
                              : "Continue searching for positions that better match your current skill set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Prepare for interviews</p>
                        <p className="text-sm text-muted-foreground">
                          Focus on demonstrating your matching skills and how you're addressing any skill gaps
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setMatchData(null)}>
                  Back
                </Button>
                {matchData.match_score >= 50 && (
                  <Button onClick={() => window.open(`/dashboard/applications`, "_self")}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Track Application
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
