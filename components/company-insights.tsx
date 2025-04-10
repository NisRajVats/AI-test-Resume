"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getJobCompanyInsights } from "@/app/actions/resume-actions"
import { Loader2, Building, Star, DollarSign, Clock, TrendingUp } from "lucide-react"

export function CompanyInsights() {
  const [company, setCompany] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const { toast } = useToast()

  const handleGetInsights = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!company) {
      toast({
        title: "Missing information",
        description: "Please enter a company name",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await getJobCompanyInsights(company)

      if (result.success) {
        setInsights(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to get company insights",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error getting company insights:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="mr-2 h-5 w-5" />
          Company Insights
        </CardTitle>
        <CardDescription>Get insights about a company before applying</CardDescription>
      </CardHeader>

      {insights ? (
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium text-lg mb-4">{company}</h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <Star className="h-5 w-5 mr-3 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Company Culture</p>
                  <p className="text-sm">{insights.culture}</p>
                </div>
              </div>

              <div className="flex items-start">
                <DollarSign className="h-5 w-5 mr-3 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Salary Range</p>
                  <p className="text-sm">{insights.salaryRange}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-3 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Work-Life Balance</p>
                  <p className="text-sm">{insights.workLifeBalance}</p>
                </div>
              </div>

              <div className="flex items-start">
                <TrendingUp className="h-5 w-5 mr-3 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Growth Opportunities</p>
                  <p className="text-sm">{insights.growthOpportunities}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">Employee Reviews</h4>
              <ul className="space-y-2">
                {insights.reviews.map((review: string, index: number) => (
                  <li key={index} className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                    "{review}"
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleGetInsights}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google, Microsoft, Amazon"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Insights...
                </>
              ) : (
                "Get Company Insights"
              )}
            </Button>
          </CardFooter>
        </form>
      )}

      {insights && (
        <CardFooter>
          <Button variant="outline" onClick={() => setInsights(null)} className="w-full">
            Search Another Company
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
