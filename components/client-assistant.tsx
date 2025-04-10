"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, FileText, User, Bot, Paperclip, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getChatHistory, addChatMessage } from "@/app/actions/db-actions"
import { DbErrorFallback } from "@/components/db-error-fallback"

// Add this import at the top of the file
import { enqueueJob } from "@/utils/job-queue"

// Initial chat message
const initialChatHistory = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm your AI career assistant. I can help you with resume feedback, interview preparation, job search advice, and more. How can I assist you today?",
    timestamp: new Date("2025-03-31T10:00:00"),
  },
]

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ClientAssistant() {
  const [chatHistory, setChatHistory] = useState<Message[]>(initialChatHistory)
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const [error, setError] = useState<Error | null>(null)

  // Fetch chat history on load
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (user) {
        try {
          const { data, error: dbError } = await getChatHistory(user.id)

          if (dbError) {
            console.error("Error fetching chat history:", dbError)
            setError(dbError)
            return
          }

          if (data && data.length > 0) {
            // Convert to the format used in the component
            const formattedData = data.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at),
            }))

            setChatHistory(formattedData)
          }
        } catch (err) {
          console.error("Error in fetchChatHistory:", err)
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }

    fetchChatHistory()
  }, [user])

  // Scroll to bottom of chat
  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Then modify the handleSendMessage function to use Redis caching
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setChatHistory((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    try {
      // Save user message to database
      await addChatMessage(user.id, {
        role: "user",
        content: inputMessage,
      })

      // Generate a cache key based on the conversation context
      const conversationContext = chatHistory
        .slice(-5) // Use last 5 messages for context
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n")

      const cacheKey = `chat:${user.id}:${hashString(conversationContext + inputMessage)}`

      // Get AI response with caching
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          history: chatHistory.slice(-5),
          cacheKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.text,
        timestamp: new Date(),
      }

      setChatHistory((prev) => [...prev, assistantMessage])

      // Save assistant message to database
      await addChatMessage(user.id, {
        role: "assistant",
        content: data.text,
      })

      // If the message is about resume analysis, enqueue a background job
      if (inputMessage.toLowerCase().includes("analyze") && inputMessage.toLowerCase().includes("resume")) {
        // Enqueue a background job for more detailed analysis
        const jobId = await enqueueJob("resume_analysis", {
          userId: user.id,
          resumeText: "Sample resume text", // In a real app, you'd get this from storage
          resumeId: "sample-resume-id",
        })

        console.log(`Enqueued resume analysis job: ${jobId}`)
      }
    } catch (error: any) {
      console.error("Error in handleSendMessage:", error)
      setError(error instanceof Error ? error : new Error(String(error)))

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      }

      setChatHistory((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Add this helper function
  function hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  if (error) {
    return (
      <DbErrorFallback
        error={error}
        resetErrorBoundary={() => setError(null)}
        title="AI Assistant Error"
        description="There was an error loading the AI Assistant"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">Get personalized career advice and interview preparation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[600px] flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col">
              <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4">
                    {chatHistory.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                      >
                        <div className="flex gap-3 max-w-[80%]">
                          {message.role === "assistant" && (
                            <Avatar>
                              <AvatarFallback>AI</AvatarFallback>
                              <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            </Avatar>
                          )}
                          <div>
                            <div
                              className={`rounded-lg p-4 ${
                                message.role === "assistant"
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <p className="whitespace-pre-line">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          {message.role === "user" && (
                            <Avatar>
                              <AvatarFallback>You</AvatarFallback>
                              <AvatarImage src="/placeholder.svg?height=40&width=40" />
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                          <Avatar>
                            <AvatarFallback>AI</AvatarFallback>
                            <AvatarImage src="/placeholder.svg?height=40&width=40" />
                          </Avatar>
                          <div>
                            <div className="rounded-lg p-4 bg-slate-100 dark:bg-slate-800">
                              <div className="flex space-x-2">
                                <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce"></div>
                                <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce delay-75"></div>
                                <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce delay-150"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="border-t p-4">
                <div className="flex items-center w-full space-x-2">
                  <Button variant="outline" size="icon" className="shrink-0">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Paperclip className="h-4 w-4" />
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={(e) => {
                          // Handle file upload
                          toast({
                            title: "Feature not available",
                            description: "File upload is not available in this demo",
                          })
                        }}
                      />
                    </label>
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    className="shrink-0"
                    onClick={handleSendMessage}
                    disabled={isTyping || !inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </TabsContent>

            <TabsContent value="tools" className="flex-1">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="mr-2 h-5 w-5" />
                        Mock Interview
                      </CardTitle>
                      <CardDescription>Practice with AI-powered mock interviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Get realistic interview practice with common questions for your target role. Receive instant
                        feedback on your responses.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "Feature not available",
                            description: "Mock interviews are not available in this demo",
                          })
                        }}
                        disabled={isTyping}
                      >
                        Start Mock Interview
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        Resume Analysis
                      </CardTitle>
                      <CardDescription>Get AI feedback on your resume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Upload your resume to receive detailed feedback and suggestions for improvement based on
                        industry standards.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "Feature not available",
                            description: "Resume analysis is not available in this demo",
                          })
                        }}
                        disabled={isTyping}
                      >
                        Upload Resume
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Skill Gap Analysis
                      </CardTitle>
                      <CardDescription>Identify skills to develop</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Compare your skills with job requirements to identify gaps and get recommendations for
                        improvement.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => {
                          const message: Message = {
                            id: Date.now().toString(),
                            role: "assistant",
                            content:
                              "Let's analyze your skill gaps. What job role are you targeting? Please also share your current skills or upload your resume so I can compare them with industry requirements.",
                            timestamp: new Date(),
                          }
                          setChatHistory((prev) => [...prev, message])
                          setActiveTab("chat")
                        }}
                        disabled={isTyping}
                      >
                        Start Analysis
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bot className="mr-2 h-5 w-5" />
                        Salary Negotiation
                      </CardTitle>
                      <CardDescription>Get negotiation strategies</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Learn effective salary negotiation techniques and get personalized advice based on your industry
                        and role.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => {
                          const message: Message = {
                            id: Date.now().toString(),
                            role: "assistant",
                            content:
                              "I can help you with salary negotiation strategies. What role and industry are you in? Do you have a specific offer you're considering or are you preparing for future negotiations?",
                            timestamp: new Date(),
                          }
                          setChatHistory((prev) => [...prev, message])
                          setActiveTab("chat")
                        }}
                        disabled={isTyping}
                      >
                        Get Advice
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Chat History</CardTitle>
            <CardDescription>Your recent conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900">
                <h4 className="font-medium text-sm">Resume Feedback</h4>
                <p className="text-xs text-muted-foreground mt-1">March 31, 2025</p>
              </div>
              <div className="border rounded-lg p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900">
                <h4 className="font-medium text-sm">Interview Preparation</h4>
                <p className="text-xs text-muted-foreground mt-1">March 30, 2025</p>
              </div>
              <div className="border rounded-lg p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900">
                <h4 className="font-medium text-sm">Salary Negotiation</h4>
                <p className="text-xs text-muted-foreground mt-1">March 28, 2025</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Chats
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
