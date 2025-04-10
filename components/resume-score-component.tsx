"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { generateResumeScore } from "@/app/actions/advanced-actions"

export default function ResumeScoreComponent({ resumeId }: { resumeId?: string }) {
  const [scoreData, setScoreData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchScore = async () => {
      if (!user || !resumeId) return

      try {
        // Mock resume text for analysis
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

        const result = await generateResumeScore(user.id, resumeId, mockResumeText, "Software Engineer", "Technology")

        if (!result.error) {
          setScoreData(result)
        }
      } catch (error) {
        console.error("Error generating resume score:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchScore()
  }, [user, resumeId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resume Score</CardTitle>
          <CardDescription>Analyzing your resume...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
        </CardContent>
      </Card>
    )
  }

  if (!scoreData) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Score</CardTitle>
        <CardDescription>How your resume performs against ATS systems</CardDescription>
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
    </Card>
  )
}
