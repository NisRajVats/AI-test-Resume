import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Optimize Your Resume with AI
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Get personalized resume optimization, job search assistance, and career guidance with our AI-powered
                platform.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full h-[350px] lg:h-[450px] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-lg flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-4/5 bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 flex flex-col">
                  <div className="w-full h-6 bg-slate-100 dark:bg-slate-800 rounded mb-4"></div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      <div className="w-3/4 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      <div className="w-5/6 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      <div className="w-4/5 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      <div className="w-3/4 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
