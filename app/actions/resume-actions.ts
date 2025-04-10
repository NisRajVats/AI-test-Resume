"use server"

import { createAdminClient } from "@/lib/supabase-client"
import { createTablesDirectly } from "@/lib/db-init"
import { getOpenAIClient } from "@/utils/ai-utils"
import { revalidatePath } from "next/cache"

const supabase = createAdminClient()

// Get user resume
export async function getUserResume(userId: string) {
  try {
    // Ensure database is initialized
    await createTablesDirectly()

    // Try to get resume
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.message.includes("does not exist")) {
          // Table doesn't exist, try to create it
          await createTablesDirectly()
          // Return empty data for now
          return { data: null }
        }
        throw error
      }

      return { data }
    } catch (error) {
      console.error("Error getting user resume:", error)
      return { error, data: null }
    }
  } catch (error) {
    console.error("Error in getUserResume:", error)
    return { error, data: null }
  }
}

// Optimize resume for a specific job
export async function optimizeResumeForJobPosting(
  userId: string,
  resumeId: string,
  jobDescription: string,
  jobTitle: string,
  company: string,
) {
  try {
    // Ensure database is initialized
    await createTablesDirectly()

    // Get the resume content
    const { data: resume, error: resumeError } = await supabase.from("resumes").select("*").eq("id", resumeId).single()

    if (resumeError) throw resumeError

    // In a real implementation, you would extract text from the resume file
    // For now, we'll use a mock resume text
    const mockResumeText = `
      John Doe
      Software Engineer
      New York, NY | john.doe@example.com | (123) 456-7890
      
      EXPERIENCE
      Senior Frontend Developer, Tech Company
      January 2020 - Present
      - Developed and maintained web applications using React and TypeScript
      - Improved application performance by 30% through code optimization
      - Led a team of 3 developers on a major feature release
      
      Junior Developer, Startup Inc
      June 2018 - December 2019
      - Worked on various frontend and backend projects using JavaScript and Node.js
      - Implemented responsive designs using HTML/CSS
      
      EDUCATION
      Bachelor of Science in Computer Science
      University Name, 2018
      
      SKILLS
      JavaScript, React, TypeScript, Node.js, HTML/CSS, Git
    `

    // Initialize OpenAI client
    const openai = getOpenAIClient()

    // Generate optimized resume
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert resume optimizer. Your task is to optimize the provided resume to better match the job description. 
          Focus on highlighting relevant skills and experiences, using keywords from the job description, and tailoring the content to the specific role.
          Return ONLY the optimized resume text without any additional explanations.`,
        },
        {
          role: "user",
          content: `Resume: ${mockResumeText}
          
          Job Description: ${jobDescription}
          
          Please optimize this resume for the job.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const optimizedResume = response.choices[0].message.content || ""

    // Ensure optimized_resumes table exists
    await createTablesDirectly()

    // Save the optimized resume
    const { data, error } = await supabase
      .from("optimized_resumes")
      .insert([
        {
          user_id: userId,
          original_resume_id: resumeId,
          job_title: jobTitle,
          company: company,
          job_description: jobDescription,
          optimized_content: optimizedResume,
        },
      ])
      .select()

    if (error) throw error

    revalidatePath("/dashboard/resume")

    return {
      success: true,
      data: data[0],
      optimizedResume,
    }
  } catch (error) {
    console.error("Error optimizing resume:", error)
    return {
      success: false,
      error: "Failed to optimize resume",
    }
  }
}

// Get company insights
export async function getJobCompanyInsights(company: string) {
  try {
    // Initialize OpenAI client
    const openai = getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert on company information. Provide insights about the company in JSON format with the following structure:
          {
            "culture": "Brief description of company culture",
            "salaryRange": "Estimated salary range for typical positions",
            "workLifeBalance": "Description of work-life balance",
            "growthOpportunities": "Description of growth opportunities",
            "reviews": ["Brief review 1", "Brief review 2", "Brief review 3"]
          }`,
        },
        {
          role: "user",
          content: `Provide insights about ${company}.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const insights = JSON.parse(response.choices[0].message.content || "{}")

    return {
      success: true,
      data: insights,
    }
  } catch (error) {
    console.error("Error getting company insights:", error)
    return {
      success: false,
      error: "Failed to get company insights",
    }
  }
}

// Rank job listings based on user profile
export async function rankJobListings(userId: string, jobs: any[]) {
  try {
    // Ensure database is initialized
    await createTablesDirectly()

    // Get user profile
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError) throw profileError

    // Get user preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    // If no preferences exist, use defaults
    const userPreferences = preferencesError
      ? {
          preferredLocations: [],
          remoteOnly: false,
          minSalary: 0,
        }
      : preferences

    // Initialize OpenAI client
    const openai = getOpenAIClient()

    // Generate rankings
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert job matcher. Rank the provided job listings based on the user's profile and preferences.
          Return a JSON array of job IDs with their match scores (0-100).`,
        },
        {
          role: "user",
          content: `User Profile: ${JSON.stringify(profile)}
          User Preferences: ${JSON.stringify(userPreferences)}
          Job Listings: ${JSON.stringify(jobs)}
          
          Please rank these jobs based on match with the user's profile and preferences.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const rankedJobs = JSON.parse(response.choices[0].message.content || "[]")

    return {
      success: true,
      data: rankedJobs,
    }
  } catch (error) {
    console.error("Error ranking jobs:", error)
    return {
      success: false,
      error: "Failed to rank jobs",
    }
  }
}
