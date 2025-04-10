import { type NextRequest, NextResponse } from "next/server"
import { getOpenAIClient } from "@/utils/ai-utils"
import { getRedisClient, CACHE_TTL } from "@/utils/redis-client"
import { rateLimitMiddleware } from "@/middleware/rate-limit"

export const maxDuration = 30 // 30 seconds

export async function POST(req: NextRequest): Promise<NextResponse> {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const { message, history, cacheKey } = await req.json()

      // Get Redis client
      const redis = getRedisClient()

      // Try to get from cache first
      if (cacheKey) {
        const cachedResponse = await redis.get(cacheKey)

        if (cachedResponse) {
          console.log(`Cache hit for key: ${cacheKey}`)
          return NextResponse.json({ text: cachedResponse })
        }

        console.log(`Cache miss for key: ${cacheKey}`)
      }

      // Initialize OpenAI client
      const openai = getOpenAIClient()

      // Prepare conversation history
      const messages = [
        {
          role: "system",
          content:
            "You are a helpful career assistant that provides advice on resumes, job applications, interviews, and career development.",
        },
        ...history.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: message,
        },
      ]

      // Generate response
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      })

      const text = response.choices[0].message.content || ""

      // Cache the response if cacheKey is provided
      if (cacheKey) {
        await redis.set(cacheKey, text, { ex: CACHE_TTL.MEDIUM })
      }

      return NextResponse.json({ text })
    } catch (error) {
      console.error("Error in chat API:", error)
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
  })
}
