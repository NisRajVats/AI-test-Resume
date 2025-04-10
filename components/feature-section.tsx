import { FileText, Search, ListChecks, MessageSquare, BarChart } from "lucide-react"

export function FeatureSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Our platform offers a comprehensive suite of tools to help you land your dream job
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <FileText className="h-12 w-12 text-slate-800 dark:text-slate-200" />
            <h3 className="text-xl font-bold">Resume Optimization</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              AI-powered resume analysis and optimization with A/B testing
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Search className="h-12 w-12 text-slate-800 dark:text-slate-200" />
            <h3 className="text-xl font-bold">Job Search</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Redirect to job portals with customized search parameters
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <ListChecks className="h-12 w-12 text-slate-800 dark:text-slate-200" />
            <h3 className="text-xl font-bold">Application Tracking</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Track your job applications and receive timely reminders
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <MessageSquare className="h-12 w-12 text-slate-800 dark:text-slate-200" />
            <h3 className="text-xl font-bold">AI Assistant</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Get personalized career advice and interview preparation
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <BarChart className="h-12 w-12 text-slate-800 dark:text-slate-200" />
            <h3 className="text-xl font-bold">Skills Analysis</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Identify skill gaps and get recommendations for improvement
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <FileText className="h-12 w-12 text-slate-800 dark:text-slate-200" />
            <h3 className="text-xl font-bold">Mock Interviews</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Practice with AI-powered mock interviews tailored to your target roles
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
