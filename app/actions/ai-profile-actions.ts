"use server"

import { getOpenAIClient } from "@/utils/ai-utils"
import { createAdminClient } from "@/lib/supabase-client"
import { ensureDatabaseTables } from "@/lib/db-init"

const supabase = createAdminClient()

type ProfileData = {
  name?: string
  preferred_role?: string
  location?: string
  bio?: string
  skills?: string
}

// Helper function to ensure profile exists
async function ensureProfileExists(userId: string) {
  try {
    // First ensure tables exist
    await ensureDatabaseTables()

    // Check if profile exists
    const { data, error } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (error || !data) {
      // Create profile if it doesn't exist
      const { error: insertError } = await supabase.from("profiles").insert({ id: userId })

      if (insertError) {
        console.error("Error creating profile:", insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error ensuring profile exists:", error)
    return false
  }
}

/**
 * Updates a user's profile based on a natural language prompt
 */
export async function updateProfileWithAI(
  userId: string,
  prompt: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Ensure profile exists
    const profileExists = await ensureProfileExists(userId)

    if (!profileExists) {
      return { success: false, message: "Failed to ensure profile exists" }
    }

    // Get the current profile data
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return { success: false, message: "Failed to fetch current profile data" }
    }

    // Initialize OpenAI client (server-side only)
    const openai = getOpenAIClient()

    // Generate AI response to update the profile
    const systemPrompt = `
      You are an AI assistant that helps users update their professional profile.
      Based on the user's request, you will generate updates to their profile.
      
      Current profile data:
      Name: ${currentProfile.name || "Not specified"}
      Preferred Role: ${currentProfile.preferred_role || "Not specified"}
      Location: ${currentProfile.location || "Not specified"}
      Bio: ${currentProfile.bio || "Not specified"}
      Skills: ${currentProfile.skills || "Not specified"}
      
      You must respond with a JSON object containing ONLY the fields that should be updated.
      For example: {"name": "John Doe", "bio": "Professional software engineer with 5 years of experience..."}
      
      Do not include fields that should remain unchanged.
      Ensure the bio is professional and concise (max 500 characters).
      Format skills as a comma-separated list.
      BE CONCISE. DO NOT INCLUDE ANY EXPLANATIONS OR ADDITIONAL TEXT OUTSIDE THE JSON OBJECT.
    `

    // Use gpt-3.5-turbo for faster response and lower cost
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    // Parse the AI response
    let updatedFields: ProfileData
    try {
      const responseText = response.choices[0].message.content?.trim() || "{}"
      updatedFields = JSON.parse(responseText)
    } catch (e) {
      console.error("Error parsing AI response:", e)
      return { success: false, message: "Failed to parse AI response" }
    }

    // Validate the updated fields
    const validFields: ProfileData = {}
    if (updatedFields.name) validFields.name = updatedFields.name
    if (updatedFields.preferred_role) validFields.preferred_role = updatedFields.preferred_role
    if (updatedFields.location) validFields.location = updatedFields.location
    if (updatedFields.bio) validFields.bio = updatedFields.bio?.substring(0, 500) // Limit bio to 500 chars
    if (updatedFields.skills) validFields.skills = updatedFields.skills

    // Update the profile
    const { error: updateError } = await supabase.from("profiles").update(validFields).eq("id", userId)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return { success: false, message: "Failed to update profile" }
    }

    return {
      success: true,
      message: `Profile updated successfully. Changed fields: ${Object.keys(validFields).join(", ")}`,
    }
  } catch (error) {
    console.error("Error in updateProfileWithAI:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
