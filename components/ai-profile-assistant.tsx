"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { updateProfileWithAI } from "@/app/actions/ai-profile-actions"
import { useAuth } from "@/components/auth-provider"
import { Sparkles, Loader2 } from "lucide-react"
import { debounce } from "lodash"

export function AIProfileAssistant() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Debounced prompt change handler
  const debouncedPromptChange = useCallback(
    debounce((value: string) => {
      setPrompt(value)
    }, 300),
    [],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to use this feature",
        variant: "destructive",
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Call the server action to update the profile with AI
      const result = await updateProfileWithAI(user.id, prompt)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setPrompt("")

        // Refresh the page to show updated profile
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating profile with AI:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
          <Sparkles className="mr-2 h-5 w-5" />
          AI Profile Assistant
        </CardTitle>
        <CardDescription>Let AI help you update your profile. Just describe what you want to change.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Textarea
            placeholder="Example: Update my bio to highlight my experience with React and Node.js. Also, add UI/UX design to my skills."
            defaultValue={prompt}
            onChange={(e) => debouncedPromptChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Profile with AI"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
