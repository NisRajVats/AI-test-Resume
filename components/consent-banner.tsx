"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [essentialConsent, setEssentialConsent] = useState(true)
  const [analyticsConsent, setAnalyticsConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem("user-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    // Save consent preferences
    localStorage.setItem(
      "user-consent",
      JSON.stringify({
        essential: essentialConsent,
        analytics: analyticsConsent,
        marketing: marketingConsent,
        timestamp: new Date().toISOString(),
      }),
    )
    setShowBanner(false)
  }

  const handleReject = () => {
    // Save minimal consent
    localStorage.setItem(
      "user-consent",
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString(),
      }),
    )
    setShowBanner(false)
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-sm">
      <Card>
        <CardHeader>
          <CardTitle>Cookie Consent</CardTitle>
          <CardDescription>
            We use cookies to enhance your experience on our website. By continuing to use this site, you consent to our
            use of cookies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="essential" checked={essentialConsent} disabled />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="essential">Essential Cookies</Label>
              <p className="text-sm text-muted-foreground">
                These cookies are necessary for the website to function and cannot be switched off.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="analytics"
              checked={analyticsConsent}
              onCheckedChange={(checked) => setAnalyticsConsent(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="analytics">Analytics Cookies</Label>
              <p className="text-sm text-muted-foreground">
                These cookies allow us to count visits and traffic sources so we can measure and improve the performance
                of our site.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="marketing">Marketing Cookies</Label>
              <p className="text-sm text-muted-foreground">
                These cookies may be set through our site by our advertising partners to build a profile of your
                interests.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReject}>
            Reject All
          </Button>
          <Button onClick={handleAccept}>Accept Selected</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
