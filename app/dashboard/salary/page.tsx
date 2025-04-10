"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getSalaryNegotiationAdvice } from "@/app/actions/advanced-actions"
import { DollarSign, Copy } from "lucide-react"

const experienceLevels = [
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "mid", label: "Mid Level (3-5 years)" },
  { value: "senior", label: "Senior Level (6-10 years)" },
  { value: "expert", label: "Expert Level (10+ years)" },
]

export default function SalaryNegotiation() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    industry: "",
    location: "",
    experienceLevel: "mid",
    currentOffer: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [negotiationData, setNegotiationData] = useState<any>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleGenerateAdvice = async () => {
    if (!formData.jobTitle || !formData.industry || !formData.location) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const result = await getSalaryNegotiationAdvice(
        formData.industry,
        formData.jobTitle,
        formData.location,
        formData.experienceLevel,
        formData.currentOffer ? Number.parseInt(formData.currentOffer) : undefined,
      )

      if (result.error) {
        throw new Error("Failed to generate negotiation advice")
      }

      setNegotiationData(result)

      toast({
        title: "Advice generated",
        description: "Your salary negotiation advice has been generated",
      })
    } catch (error) {
      console.error("Error generating advice:", error)
      toast({
        title: "Error",
        description: "Failed to generate negotiation advice",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salary Negotiation Coach</h1>
        <p className="text-muted-foreground">Get personalized salary negotiation advice</p>
      </div>

      {!negotiationData ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate Negotiation Advice</CardTitle>
            <CardDescription>Enter job details to get personalized advice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                placeholder="e.g. Technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. New York, NY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select
                value={formData.experienceLevel}
                onValueChange={(value) => handleSelectChange("experienceLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentOffer">Current Offer (Optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentOffer"
                  name="currentOffer"
                  value={formData.currentOffer}
                  onChange={handleInputChange}
                  placeholder="e.g. 85000"
                  type="number"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter the amount without commas or currency symbols</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateAdvice}
              disabled={!formData.jobTitle || !formData.industry || !formData.location || isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating..." : "Generate Advice"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Tabs defaultValue="advice">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="advice">Negotiation Advice</TabsTrigger>
            <TabsTrigger value="salary">Salary Data</TabsTrigger>
          </TabsList>

          <TabsContent value="advice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Negotiation Strategy</CardTitle>
                <CardDescription>
                  Personalized advice for {formData.jobTitle} in {formData.industry}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4 whitespace-pre-line">{negotiationData.advice}</div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setNegotiationData(null)}>
                  Back
                </Button>
                <Button onClick={() => copyToClipboard(negotiationData.advice)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Advice
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Phrases to Use</CardTitle>
                <CardDescription>Effective phrases for your negotiation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="font-medium">When discussing your value</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      "Based on my experience with [specific achievement], I believe I can bring significant value to
                      this role."
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        copyToClipboard(
                          "Based on my experience with [specific achievement], I believe I can bring significant value to this role.",
                        )
                      }
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="font-medium">When countering an offer</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      "I appreciate the offer. Given my skills and the market rate for this position, I was expecting
                      something closer to [target salary]."
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        copyToClipboard(
                          "I appreciate the offer. Given my skills and the market rate for this position, I was expecting something closer to [target salary].",
                        )
                      }
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="font-medium">When discussing benefits</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      "I'm also interested in discussing the complete compensation package, including benefits, equity,
                      and growth opportunities."
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        copyToClipboard(
                          "I'm also interested in discussing the complete compensation package, including benefits, equity, and growth opportunities.",
                        )
                      }
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Salary Range</CardTitle>
                <CardDescription>
                  Market data for {formData.jobTitle} in {formData.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Minimum</p>
                    <p className="text-2xl font-bold mt-1">${negotiationData.salaryData.min_salary.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border p-4 bg-slate-50 dark:bg-slate-800">
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className="text-2xl font-bold mt-1">${negotiationData.salaryData.avg_salary.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Maximum</p>
                    <p className="text-2xl font-bold mt-1">${negotiationData.salaryData.max_salary.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">${negotiationData.salaryData.min_salary.toLocaleString()}</span>
                    <span className="text-sm">${negotiationData.salaryData.max_salary.toLocaleString()}</span>
                  </div>
                  <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <div
                      className="absolute h-4 w-4 bg-primary rounded-full top-1/2 -translate-y-1/2"
                      style={{
                        left: `${
                          ((negotiationData.salaryData.avg_salary - negotiationData.salaryData.min_salary) /
                            (negotiationData.salaryData.max_salary - negotiationData.salaryData.min_salary)) *
                          100
                        }%`,
                      }}
                    ></div>
                    {formData.currentOffer && (
                      <div
                        className="absolute h-4 w-4 bg-yellow-500 rounded-full top-1/2 -translate-y-1/2"
                        style={{
                          left: `${
                            ((Number.parseInt(formData.currentOffer) - negotiationData.salaryData.min_salary) /
                              (negotiationData.salaryData.max_salary - negotiationData.salaryData.min_salary)) *
                            100
                          }%`,
                        }}
                      ></div>
                    )}
                  </div>
                  <div className="flex justify-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formData.currentOffer
                        ? `Your current offer (${Number.parseInt(formData.currentOffer).toLocaleString()}) is shown in yellow`
                        : "Average salary shown in primary color"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target Negotiation Range</CardTitle>
                <CardDescription>Recommended range for your negotiation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Minimum Acceptable</p>
                      <p className="text-sm text-muted-foreground">Don't go below this amount</p>
                    </div>
                    <p className="text-lg font-bold">
                      ${Math.round(negotiationData.salaryData.avg_salary * 0.9).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Target Amount</p>
                      <p className="text-sm text-muted-foreground">Your ideal outcome</p>
                    </div>
                    <p className="text-lg font-bold">
                      ${Math.round(negotiationData.salaryData.avg_salary * 1.1).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Initial Ask</p>
                      <p className="text-sm text-muted-foreground">Start with this amount</p>
                    </div>
                    <p className="text-lg font-bold">
                      ${Math.round(negotiationData.salaryData.avg_salary * 1.2).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
