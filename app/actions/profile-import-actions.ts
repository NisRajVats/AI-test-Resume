"use server"

import { getOpenAIClient } from "@/utils/ai-utils"
import { createAdminClient } from "@/lib/supabase-client"
import { cache } from "react"

const supabase = createAdminClient()

// Cache for 1 hour
const CACHE_TTL = 60 * 60 * 1000

// In-memory cache for AI responses
const aiResponseCache = new Map<string, { data: any; timestamp: number }>()

type ProfileData = {
  name?: string
  preferred_role?: string
  location?: string
  bio?: string
  skills?: string
}

// Cached version of the profile fetching function
export const getProfileData = cache(async (userId: string) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) throw error
  return data
})

/**
 * Imports a profile from a LinkedIn, Indeed, or Glassdoor URL
 */
export async function importProfileFromUrl(
  userId: string,
  profileUrl: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Check cache first
    const cacheKey = `import_${userId}_${profileUrl}`
    const cachedResult = aiResponseCache.get(cacheKey)

    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      // Use cached result if it's still valid
      const { data: profileData } = cachedResult

      // Update the profile with cached data
      const { error: updateError } = await supabase.from("profiles").update(profileData).eq("id", userId)

      if (updateError) {
        console.error("Error updating profile with cached data:", updateError)
        return { success: false, message: "Failed to update profile with imported data" }
      }

      return {
        success: true,
        message: `Profile successfully imported (cached result)`,
      }
    }

    // In a real implementation, we would scrape the profile data from the URL
    // For this demo, we'll simulate the process using AI to generate profile data

    // Determine the platform from the URL
    let platform = "unknown"
    if (profileUrl.includes("linkedin.com")) platform = "LinkedIn"
    else if (profileUrl.includes("indeed.com")) platform = "Indeed"
    else if (profileUrl.includes("glassdoor.com")) platform = "Glassdoor"

    // Initialize OpenAI client (server-side only)
    const openai = getOpenAIClient()

    // Generate AI response to simulate profile data extraction
    const systemPrompt = `
     You are an AI assistant that extracts professional profile data from URLs.
     For this simulation, generate realistic profile data for a ${platform} profile.
     
     You must respond with a JSON object containing the following fields:
     - name: The person's full name
     - preferred_role: Their current job title or preferred role
     - location: Their location (city, state, country)
     - bio: A professional summary or bio (max 500 characters)
     - skills: A comma-separated list of their professional skills
     
     BE CONCISE. DO NOT INCLUDE ANY EXPLANATIONS OR ADDITIONAL TEXT OUTSIDE THE JSON OBJECT.
   `

    // Use gpt-3.5-turbo for faster response and lower cost
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate realistic profile data for a ${platform} profile at URL: ${profileUrl}` },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    // Parse the AI response
    let profileData: ProfileData
    try {
      const responseText = response.choices[0].message.content?.trim() || "{}"
      profileData = JSON.parse(responseText)
    } catch (e) {
      console.error("Error parsing AI response:", e)
      return { success: false, message: "Failed to parse profile data" }
    }

    // Validate the profile data
    const validFields: ProfileData = {}
    if (profileData.name) validFields.name = profileData.name
    if (profileData.preferred_role) validFields.preferred_role = profileData.preferred_role
    if (profileData.location) validFields.location = profileData.location
    if (profileData.bio) validFields.bio = profileData.bio?.substring(0, 500) // Limit bio to 500 chars
    if (profileData.skills) validFields.skills = profileData.skills

    // Cache the result
    aiResponseCache.set(cacheKey, {
      data: validFields,
      timestamp: Date.now(),
    })

    // Update the profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ...validFields,
        imported_from: platform,
        last_optimized: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return { success: false, message: "Failed to update profile with imported data" }
    }

    return {
      success: true,
      message: `Profile successfully imported from ${platform}`,
    }
  } catch (error) {
    console.error("Error in importProfileFromUrl:", error)
    return { success: false, message: "An unexpected error occurred while importing your profile" }
  }
}

/**
 * Analyzes a profile and generates optimized versions
 */
export async function analyzeAndOptimizeProfile(userId: string): Promise<{
  success: boolean
  message: string
  analysis?: {
    tone: string
    structure: string
    keywords: string[]
    clarity: string
    suggestions: string[]
  }
  optimizedBio?: string
}> {
  try {
    // Check cache first
    const cacheKey = `analyze_${userId}`
    const cachedResult = aiResponseCache.get(cacheKey)

    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      // Use cached result if it's still valid
      return {
        success: true,
        message: "Profile analysis completed successfully (cached result)",
        ...cachedResult.data,
      }
    }

    // Get the current profile data
    const profile = await getProfileData(userId)

    // Truncate the bio to 500 characters to reduce token usage
    const truncatedBio = profile.bio?.substring(0, 500) || "Not specified"

    // Initialize OpenAI client (server-side only)
    const openai = getOpenAIClient()

    // Generate AI analysis
    const systemPrompt = `
     You are an expert resume and profile analyzer.
     Analyze the provided profile and provide detailed feedback.
     
     Profile:
     Name: ${profile.name || "Not specified"}
     Role: ${profile.preferred_role || "Not specified"}
     Location: ${profile.location || "Not specified"}
     Bio: ${truncatedBio}
     Skills: ${profile.skills || "Not specified"}
     
     You must respond with a JSON object containing:
     - analysis: An object with tone, structure, keywords (array), clarity, and suggestions (array)
     - optimizedBio: An improved version of the bio
     
     BE CONCISE. DO NOT INCLUDE ANY EXPLANATIONS OR ADDITIONAL TEXT OUTSIDE THE JSON OBJECT.
   `

    // Use gpt-3.5-turbo for faster response and lower cost
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Analyze this professional profile and provide optimization suggestions" },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Parse the AI response
    let analysisData: any
    try {
      const responseText = response.choices[0].message.content?.trim() || "{}"
      analysisData = JSON.parse(responseText)
    } catch (e) {
      console.error("Error parsing AI analysis:", e)
      return { success: false, message: "Failed to parse profile analysis" }
    }

    // Cache the result
    aiResponseCache.set(cacheKey, {
      data: {
        analysis: analysisData.analysis,
        optimizedBio: analysisData.optimizedBio,
      },
      timestamp: Date.now(),
    })

    return {
      success: true,
      message: "Profile analysis completed successfully",
      analysis: analysisData.analysis,
      optimizedBio: analysisData.optimizedBio,
    }
  } catch (error) {
    console.error("Error in analyzeAndOptimizeProfile:", error)
    return { success: false, message: "An unexpected error occurred during profile analysis" }
  }
}
