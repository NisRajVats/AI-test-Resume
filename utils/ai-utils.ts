import OpenAI from "openai"
import { getRedisClient, CACHE_TTL, generateCacheKey } from "./redis-client"

// Singleton pattern for OpenAI client
let openaiClient: OpenAI | null = null

// Initialize OpenAI only on the server side
const getOpenAIClient = () => {
  // Make sure we're not in a browser environment
  if (typeof window !== "undefined") {
    throw new Error("OpenAI client should only be initialized on the server")
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openaiClient
}

// Remove the direct initialization of openai and export the function instead
export { getOpenAIClient }

// Get cached response or generate new one
export async function getCachedOrGenerateAIResponse<T>(
  cacheKey: string,
  generateFn: () => Promise<T>,
  ttl = CACHE_TTL.MEDIUM,
): Promise<T> {
  try {
    // Get Redis client
    const redis = getRedisClient()

    // Try to get from cache first
    const cachedResult = await redis.get(cacheKey)

    if (cachedResult) {
      console.log(`Cache hit for key: ${cacheKey}`)
      return cachedResult as T
    }

    console.log(`Cache miss for key: ${cacheKey}`)

    // Generate new result
    const result = await generateFn()

    // Cache the result
    await redis.set(cacheKey, result, { ex: ttl })

    return result
  } catch (error) {
    console.error("Redis cache error:", error)
    // Fallback to direct generation if Redis fails
    return generateFn()
  }
}

// Function to optimize resume for a specific job description
export async function optimizeResumeForJob(resumeText: string, jobDescription: string): Promise<string> {
  const cacheKey = generateCacheKey(
    "resume:optimize",
    hashString(resumeText.substring(0, 100)),
    hashString(jobDescription.substring(0, 100)),
  )

  return getCachedOrGenerateAIResponse(cacheKey, async () => {
    // Only initialize OpenAI on the server
    const openai = getOpenAIClient()

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
          content: `Resume: ${resumeText.substring(0, 2000)}
           
           Job Description: ${jobDescription.substring(0, 2000)}
           
           Please optimize this resume for the job.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    return response.choices[0].message.content || ""
  })
}

// Function to extract company insights
export async function getCompanyInsights(companyName: string): Promise<any> {
  const cacheKey = generateCacheKey("company:insights", companyName)

  return getCachedOrGenerateAIResponse(
    cacheKey,
    async () => {
      // Only initialize OpenAI on the server
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
            content: `Provide insights about ${companyName}.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      try {
        return JSON.parse(response.choices[0].message.content || "{}")
      } catch (e) {
        console.error("Error parsing company insights:", e)
        return {
          culture: "Information not available",
          salaryRange: "Information not available",
          workLifeBalance: "Information not available",
          growthOpportunities: "Information not available",
          reviews: ["No reviews available"],
        }
      }
    },
    CACHE_TTL.WEEK,
  ) // Cache company insights for a week
}

// Simple string hashing function for cache keys
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}
