"use server"

import { createAdminClient } from "@/lib/supabase-client"
import { getOpenAIClient } from "@/utils/ai-utils"
import { createTablesDirectly } from "@/lib/db-init"

// Create a Supabase client with service role for server actions
const supabase = createAdminClient()

// Helper function to ensure database is initialized
async function ensureDatabase() {
  try {
    // Create tables directly
    const result = await createTablesDirectly()
    return result.success
  } catch (error) {
    console.error("Error ensuring database:", error)
    return false
  }
}

// Resume Score Generator
export async function generateResumeScore(
  userId: string,
  resumeId: string,
  resumeText: string,
  jobTitle?: string,
  industry?: string,
) {
  try {
    // Ensure database is initialized
    await ensureDatabase()

    // Initialize OpenAI client (server-side only)
    const openai = getOpenAIClient()

    const systemPrompt = `
     You are an expert ATS (Applicant Tracking System) analyzer and resume scorer.
     Analyze the provided resume and score it on the following criteria on a scale of 0-100:
     1. ATS Compatibility: How well the resume would perform in automated screening systems
     2. Content Quality: Strength of achievements, skills, and experience descriptions
     3. Formatting: Structure, readability, and professional appearance
     4. Keyword Optimization: Presence of relevant industry and role-specific keywords
     
     Also calculate an overall score (0-100) based on these factors.
     
     ${jobTitle ? `The target job title is: ${jobTitle}` : ""}
     ${industry ? `The target industry is: ${industry}` : ""}
     
     Return ONLY a JSON object with the following structure:
     {
       "ats_score": number,
       "content_score": number,
       "format_score": number,
       "keyword_score": number,
       "overall_score": number,
       "strengths": [string, string, ...],
       "weaknesses": [string, string, ...],
       "improvement_tips": [string, string, ...]
     }
   `

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: resumeText,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Parse the JSON response
    const text = response.choices[0].message.content || "{}"
    const scoreData = JSON.parse(text)

    try {
      // Save to database
      const { data, error } = await supabase
        .from("resume_scores")
        .insert([
          {
            user_id: userId,
            resume_id: resumeId,
            ats_score: scoreData.ats_score,
            content_score: scoreData.content_score,
            format_score: scoreData.format_score,
            keyword_score: scoreData.keyword_score,
            overall_score: scoreData.overall_score,
            industry: industry,
            job_title: jobTitle,
          },
        ])
        .select()

      if (error) {
        if (error.message.includes("does not exist")) {
          // Table doesn't exist, try to create it
          await createTablesDirectly()
        } else {
          console.error("Error saving resume score:", error)
        }
      }
    } catch (dbError) {
      console.error("Database error saving resume score:", dbError)
    }

    return {
      ...scoreData,
      id: "temp-id", // Use a temporary ID if we couldn't save to the database
    }
  } catch (error) {
    console.error("Error generating resume score:", error)
    return { error }
  }
}

// Industry Benchmarking
export async function getIndustryBenchmarks(industry: string, jobTitle: string) {
  try {
    // Ensure database is initialized
    await ensureDatabase()

    // First check if we have the benchmark in our database
    try {
      const { data, error } = await supabase
        .from("industry_benchmarks")
        .select("*")
        .eq("industry", industry)
        .eq("job_title", jobTitle)
        .single()

      if (!error && data) {
        return { data }
      }
    } catch (dbError) {
      console.error("Error checking for existing benchmarks:", dbError)
    }

    // If not in database, generate it with AI
    const openai = getOpenAIClient()

    const systemPrompt = `
     You are an expert in resume standards and industry benchmarks.
     Generate realistic benchmark data for the ${jobTitle} role in the ${industry} industry.
     
     Return ONLY a JSON object with the following structure:
     {
       "avg_ats_score": number (0-100),
       "avg_content_score": number (0-100),
       "avg_format_score": number (0-100),
       "avg_keyword_score": number (0-100),
       "avg_overall_score": number (0-100),
       "required_skills": [string, string, ...],
       "preferred_skills": [string, string, ...]
     }
   `

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate industry benchmarks for ${jobTitle} in ${industry}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Parse the JSON response
    const text = response.choices[0].message.content || "{}"
    const benchmarkData = JSON.parse(text)

    try {
      // Save to database for future use
      const { data: savedData, error: saveError } = await supabase
        .from("industry_benchmarks")
        .insert([
          {
            industry: industry,
            job_title: jobTitle,
            avg_ats_score: benchmarkData.avg_ats_score,
            avg_content_score: benchmarkData.avg_content_score,
            avg_format_score: benchmarkData.avg_format_score,
            avg_keyword_score: benchmarkData.avg_keyword_score,
            avg_overall_score: benchmarkData.avg_overall_score,
            required_skills: benchmarkData.required_skills,
            preferred_skills: benchmarkData.preferred_skills,
          },
        ])
        .select()

      if (saveError) {
        if (saveError.message.includes("does not exist")) {
          // Table doesn't exist, try to create it
          await createTablesDirectly()
        } else {
          console.error("Error saving benchmark data:", saveError)
        }
      }
    } catch (dbError) {
      console.error("Database error saving benchmark data:", dbError)
    }

    return { data: benchmarkData }
  } catch (error) {
    console.error("Error getting industry benchmarks:", error)
    return { error }
  }
}

// Job Match Score
export async function calculateJobMatchScore(
  userId: string,
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  company: string,
  location?: string,
) {
  try {
    // Ensure database is initialized
    await ensureDatabase()

    // Initialize OpenAI client (server-side only)
    const openai = getOpenAIClient()

    const systemPrompt = `
     You are an expert job match analyzer.
     Compare the provided resume with the job description and calculate a match score on a scale of 0-100.
     
     Return ONLY a JSON object with the following structure:
     {
       "match_score": number (0-100),
       "skills_match": [string, string, ...],
       "skills_missing": [string, string, ...],
       "strengths": [string, string, ...],
       "weaknesses": [string, string, ...],
       "recommendation": string (whether the candidate should apply or not)
     }
   `

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Resume: ${resumeText}

Job Description: ${jobDescription}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Parse the JSON response
    const text = response.choices[0].message.content || "{}"
    const matchData = JSON.parse(text)

    try {
      // Save to database
      const { data, error } = await supabase
        .from("job_matches")
        .insert([
          {
            user_id: userId,
            job_title: jobTitle,
            company: company,
            location: location,
            job_description: jobDescription,
            match_score: matchData.match_score,
            skills_match: matchData.skills_match,
            skills_missing: matchData.skills_missing,
          },
        ])
        .select()

      if (error) {
        if (error.message.includes("does not exist")) {
          // Table doesn't exist, try to create it
          await createTablesDirectly()
        } else {
          console.error("Error saving job match:", error)
        }
      }

      return {
        ...matchData,
        id: data?.[0]?.id || "temp-id",
      }
    } catch (dbError) {
      console.error("Database error saving job match:", dbError)
      return {
        ...matchData,
        id: "temp-id",
      }
    }
  } catch (error) {
    console.error("Error calculating job match score:", error)
    return { error }
  }
}

// AI Follow-Up Generator
export async function generateFollowUpEmail(userId: string, applicationId: string, applicationData: any) {
  try {
    // Ensure database is initialized
    await ensureDatabase()

    // Initialize OpenAI client (server-side only)
    const openai = getOpenAIClient()

    const systemPrompt = `
     You are an expert in professional communication and job application follow-ups.
     Generate a personalized follow-up email for a job application with the following details:
     - Company: ${applicationData.company}
     - Position: ${applicationData.position}
     - Date Applied: ${applicationData.dateApplied}
     - Current Status: ${applicationData.status}
     - Previous Notes: ${applicationData.notes || "None"}
     
     The email should be professional, concise, and express continued interest in the position.
     Include a reference to the specific role and company, and offer to provide additional information if needed.
     
     Return ONLY the email text, without subject line.
   `

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate a follow-up email for my application to ${applicationData.position} at ${applicationData.company}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const text = response.choices[0].message.content || ""

    // Calculate a good follow-up date (7 days after application if recent, or 3 days from now if older)
    const applicationDate = new Date(applicationData.dateApplied)
    const now = new Date()
    const daysSinceApplication = Math.floor((now.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24))

    let followUpDate
    if (daysSinceApplication < 7) {
      followUpDate = new Date(applicationDate)
      followUpDate.setDate(followUpDate.getDate() + 7)
    } else {
      followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + 3)
    }

    try {
      // Save to database
      const { data, error } = await supabase
        .from("follow_ups")
        .insert([
          {
            user_id: userId,
            application_id: applicationId,
            content: text,
            scheduled_date: followUpDate.toISOString(),
          },
        ])
        .select()

      if (error) {
        if (error.message.includes("does not exist")) {
          // Table doesn't exist, try to create it
          await createTablesDirectly()
        } else {
          console.error("Error saving follow-up email:", error)
        }
      }

      return {
        email: text,
        scheduledDate: followUpDate,
        id: data?.[0]?.id || "temp-id",
      }
    } catch (dbError) {
      console.error("Database error saving follow-up email:", dbError)
      return {
        email: text,
        scheduledDate: followUpDate,
        id: "temp-id",
      }
    }
  } catch (error) {
    console.error("Error generating follow-up email:", error)
    return { error }
  }
}

// Job Alerts
export async function createJobAlert(
  userId: string,
  jobTitle: string,
  location?: string,
  keywords?: string[],
  frequency = "daily",
) {
  try {
    // Ensure database is initialized
    await ensureDatabase()

    try {
      const { data, error } = await supabase
        .from("job_alerts")
        .insert([
          {
            user_id: userId,
            job_title: jobTitle,
            location: location,
            keywords: keywords,
            frequency: frequency,
          },
        ])
        .select()

      if (error) {
        if (error.message.includes("does not exist")) {
          // Table doesn't exist, try to create it
          await createTablesDirectly()
          return { data: [{ id: "temp-id", job_title: jobTitle, location, keywords, frequency }] }
        }
        throw error
      }

      return { data }
    } catch (dbError) {
      console.error("Database error creating job alert:", dbError)
      return { error: dbError, data: [{ id: "temp-id", job_title: jobTitle, location, keywords, frequency }] }
    }
  } catch (error) {
    console.error("Error creating job alert:", error)
    return { error }
  }
}

export async function getJobAlerts(userId: string) {
  try {
    // Ensure database is initialized
    await ensureDatabase()

    try {
      const { data, error } = await supabase
        .from("job_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.message.includes("does not exist")) {
          // Table doesn't exist, try to create it
          await createTablesDirectly()
          return { data: [] }
        }
        throw error
      }

      return { data }
    } catch (dbError) {
      console.error("Error getting job alerts:", dbError)
      return { error: dbError, data: [] }
    }
  } catch (error) {
    console.error("Error getting job alerts:", error)
    return { error, data: [] }
  }
}

export async function deleteJobAlert(alertId: string) {
  try {
    const { error } = await supabase.from("job_alerts").delete().eq("id", alertId)

    if (error) {
      if (error.message.includes("does not exist")) {
        // Table doesn't exist, try to create it
        await createTablesDirectly()
        return { success: true }
      }
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting job alert:", error)
    return { error }
  }
}

// Get follow-ups
export async function getFollowUps(userId: string) {
  try {
    // Ensure database is initialized
    await ensureDatabase()

    try {
      // First try with the join
      const { data, error } = await supabase
        .from("follow_ups")
        .select(`
          *,
          applications:application_id (
            company,
            position,
            status
          )
        `)
        .eq("user_id", userId)
        .order("scheduled_date", { ascending: true })

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("relationship")) {
          // Table doesn't exist or relationship issue, try to create tables
          await createTablesDirectly()

          // Try a simpler query without the join
          const { data: simpleData, error: simpleError } = await supabase
            .from("follow_ups")
            .select("*")
            .eq("user_id", userId)
            .order("scheduled_date", { ascending: true })

          if (simpleError) {
            return { data: [] }
          }

          return { data: simpleData }
        }
        throw error
      }

      return { data }
    } catch (dbError) {
      console.error("Error getting follow-ups:", dbError)
      return { error: dbError, data: [] }
    }
  } catch (error) {
    console.error("Error getting follow-ups:", error)
    return { error, data: [] }
  }
}

// Mark follow-up as sent
export async function markFollowUpAsSent(followUpId: string) {
  try {
    const { error } = await supabase.from("follow_ups").update({ sent: true }).eq("id", followUpId)

    if (error) {
      if (error.message.includes("does not exist")) {
        // Table doesn't exist, try to create it
        await createTablesDirectly()
        return { success: true }
      }
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error marking follow-up as sent:", error)
    return { error }
  }
}

// Salary Negotiation Coach
export async function getSalaryNegotiationAdvice(
  industry: string,
  jobTitle: string,
  location: string,
  experienceLevel: string,
  currentOffer?: number,
) {
  try {
    // Initialize OpenAI client
    const openai = getOpenAIClient()

    // Generate salary data
    const salarySystemPrompt = `
      You are an expert in salary data and compensation trends.
      Generate realistic salary range data for a ${jobTitle} role in the ${industry} industry in ${location} for someone with ${experienceLevel} experience level.
      
      Return ONLY a JSON object with the following structure:
      {
        "min_salary": number,
        "max_salary": number,
        "avg_salary": number,
        "currency": "USD"
      }
    `

    const salaryResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: salarySystemPrompt,
        },
        {
          role: "user",
          content: `Generate salary data for ${jobTitle} in ${industry} in ${location} with ${experienceLevel} experience`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Parse the JSON response
    const salaryText = salaryResponse.choices[0].message.content || "{}"
    const salaryData = JSON.parse(salaryText)

    // Now generate negotiation advice
    const adviceSystemPrompt = `
      You are an expert salary negotiation coach.
      Provide personalized negotiation advice for a ${jobTitle} role in the ${industry} industry in ${location} for someone with ${experienceLevel} experience level.
      
      Salary data:
      - Minimum: ${salaryData.min_salary}
      - Maximum: ${salaryData.max_salary}
      - Average: ${salaryData.avg_salary}
      ${currentOffer ? `- Current offer: ${currentOffer}` : ""}
      
      Include the following in your advice:
      1. Assessment of the offer compared to market rates
      2. Specific negotiation tactics and phrases to use
      3. Additional benefits to consider beyond base salary
      4. When to walk away from an offer
      5. How to respond to common pushback
      
      Be specific, practical, and actionable in your advice.
    `

    const adviceResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: adviceSystemPrompt,
        },
        {
          role: "user",
          content: `Provide salary negotiation advice for ${jobTitle} in ${industry}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const adviceText = adviceResponse.choices[0].message.content || ""

    return {
      advice: adviceText,
      salaryData,
    }
  } catch (error) {
    console.error("Error getting salary negotiation advice:", error)
    return { error }
  }
}
