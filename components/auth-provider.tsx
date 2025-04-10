"use client"

import React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"
import { AuthError } from "@supabase/supabase-js"

// Update the User type to match what we get from Supabase
type UserWithProfile = {
  id: string
  email: string
  name?: string
  preferred_role?: string
  location?: string
  bio?: string
  skills?: string
}

type AuthContextType = {
  user: UserWithProfile | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserWithProfile>) => Promise<void>
  resendConfirmationEmail: (email: string) => Promise<boolean>
  supabase: ReturnType<typeof getSupabaseClient>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Helper function to handle retries
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = RETRY_DELAY): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof AuthError) {
      // Handle specific auth errors
      if (error.message.includes("refresh_token_already_used")) {
        console.warn("Token already used, creating a new session")
        throw error // Let the caller handle this specific error
      }

      if (error.message.includes("over_request_rate_limit") && retries > 0) {
        console.warn(`Rate limited, retrying in ${delay}ms. Retries left: ${retries}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return withRetry(fn, retries - 1, delay * 2) // Exponential backoff
      }
    }

    // For other errors or if we're out of retries
    throw error
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Use the singleton Supabase client
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await withRetry(() => supabase.auth.getSession())

        if (session) {
          // Get user profile data
          const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: data?.name,
            preferred_role: data?.preferred_role,
            location: data?.location,
            bio: data?.bio,
            skills: data?.skills,
          })
        }
      } catch (error) {
        console.error("Error checking session:", error)
        // If token is already used, sign out and redirect to login
        if (error instanceof AuthError && error.message.includes("refresh_token_already_used")) {
          await supabase.auth.signOut()
          router.push("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session) {
          // Get user profile data
          const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: data?.name,
            preferred_role: data?.preferred_role,
            location: data?.location,
            bio: data?.bio,
            skills: data?.skills,
          })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error in auth state change:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log("Signing up with email:", email)

      const { data, error } = await withRetry(() =>
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        }),
      )

      if (error) {
        console.error("Supabase signup error:", error)
        throw error
      }

      if (data.user) {
        console.log("User created, creating profile")

        // First check if a profile already exists with this email
        const { data: existingProfile } = await supabase.from("profiles").select("id").eq("email", email).single()

        if (!existingProfile) {
          // Only create a profile if one doesn't already exist
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            name,
            email,
          })

          if (profileError) {
            // If it's not a duplicate key error, throw it
            if (!profileError.message.includes("duplicate key value")) {
              console.error("Error creating profile:", profileError)
              throw profileError
            } else {
              console.log("Profile already exists, skipping creation")
            }
          }
        } else {
          console.log("Profile already exists, skipping creation")
        }

        router.push("/login?signup=success")
      }
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  // Update the signIn function to handle unconfirmed emails
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await withRetry(() =>
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
      )

      if (error) {
        // Check if the error is due to email not being confirmed
        if (error.message.includes("Email not confirmed")) {
          // Send another confirmation email - use the correct method
          await supabase.auth.resend({
            type: "signup",
            email: email,
          })
          throw new Error("Email not confirmed. A new confirmation email has been sent.")
        }
        throw error
      }

      router.push("/dashboard")
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await withRetry(() => supabase.auth.signOut())
      if (error) throw error

      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const updateProfile = async (data: Partial<UserWithProfile>) => {
    try {
      if (!user) throw new Error("No user logged in")

      const { error } = await supabase.from("profiles").update(data).eq("id", user.id)

      if (error) throw error

      setUser({ ...user, ...data })
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  // Update the resendConfirmationEmail function to use the correct API
  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await withRetry(() =>
        supabase.auth.resend({
          type: "signup",
          email: email,
        }),
      )
      if (error) throw error
      return true
    } catch (error) {
      console.error("Error resending confirmation email:", error)
      throw error
    }
  }

  // Add the new function to the context value
  const contextValue = React.useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      resendConfirmationEmail,
      supabase,
    }),
    [user, loading, supabase],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
