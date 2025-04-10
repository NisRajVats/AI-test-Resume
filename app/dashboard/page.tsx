import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Search, ListChecks, MessageSquare, BarChart, Mail, Percent, DollarSign } from "lucide-react"
import Link from "next/link"
import ErrorBoundary from "@/components/error-boundary"
import { SuspenseBoundary } from "@/components/suspense-boundary"

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your AI Resume dashboard</p>
        </div>

        <SuspenseBoundary title="Loading Dashboard" description="Please wait while we load your dashboard data">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resume Optimizations</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Upload your resume to get started</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Job Searches</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Find your next opportunity</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Track your job applications</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Chats</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Get career advice from AI</p>
              </CardContent>
            </Card>
          </div>
        </SuspenseBoundary>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Link
                href="/dashboard/resume"
                className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 hover:border-primary cursor-pointer"
              >
                <FileText className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Upload Resume</p>
              </Link>
              <Link
                href="/dashboard/jobs"
                className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 hover:border-primary cursor-pointer"
              >
                <Search className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Search Jobs</p>
              </Link>
              <Link
                href="/dashboard/applications"
                className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 hover:border-primary cursor-pointer"
              >
                <ListChecks className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Add Application</p>
              </Link>
              <Link
                href="/dashboard/assistant"
                className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 hover:border-primary cursor-pointer"
              >
                <MessageSquare className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Chat with AI</p>
              </Link>
              <Link
                href="/dashboard/resume/score"
                className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 hover:border-primary cursor-pointer"
              >
                <Percent className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Resume Score</p>
              </Link>
              <Link
                href="/dashboard/match"
                className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 hover:border-primary cursor-pointer"
              >
                <BarChart className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Job Match</p>
              </Link>
              <Link
                href="/dashboard/follow-up"
                className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 hover:border-primary cursor-pointer"
              >
                <Mail className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Follow-Up</p>
              </Link>
              <Link
                href="/dashboard/salary"
                className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 hover:border-primary cursor-pointer"
              >
                <DollarSign className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Salary Coach</p>
              </Link>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Follow these steps to make the most of AI Resume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Upload your resume</p>
                    <p className="text-sm text-muted-foreground">Get AI-powered optimization suggestions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Check your resume score</p>
                    <p className="text-sm text-muted-foreground">See how your resume compares to industry standards</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Set up job alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified about new job opportunities</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Calculate job match scores</p>
                    <p className="text-sm text-muted-foreground">Find jobs that match your skills and experience</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Track your applications</p>
                    <p className="text-sm text-muted-foreground">Keep all your job applications organized</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    6
                  </div>
                  <div>
                    <p className="font-medium">Generate follow-up emails</p>
                    <p className="text-sm text-muted-foreground">
                      Send professional follow-ups to improve your chances
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  )
}
