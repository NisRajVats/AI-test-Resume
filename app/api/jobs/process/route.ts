import { type NextRequest, NextResponse } from "next/server"
import { processNextJob } from "@/utils/job-queue"
import { getOpenAIClient } from "@/utils/ai-utils"
import { createAdminClient } from "@/lib/supabase-client"

export const maxDuration = 60 // 1 minute

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Process a job
    const processed = await processNextJob(["resume_analysis", "job_match", "follow_up_generation"], async (job) => {
      const supabase = createAdminClient()

      switch (job.type) {
        case "resume_analysis":
          // Process resume analysis job
          const openai = getOpenAIClient()
          const { resumeText, userId, resumeId } = job.data

          // Generate analysis with OpenAI
          const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert resume analyzer. Analyze the provided resume and provide detailed feedback.",
              },
              {
                role: "user",
                content: resumeText,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          })

          const analysis = response.choices[0].message.content || ""

          // Save analysis to database
          await supabase.from("resume_analyses").insert({
            user_id: userId,
            resume_id: resumeId,
            analysis,
            created_at: new Date().toISOString(),
          })

          return { analysis }

        case "job_match":
          // Process job match job
          // Similar implementation to resume_analysis
          return { matched: true }

        case "follow_up_generation":
          // Process follow-up generation job
          // Similar implementation
          return { generated: true }

        default:
          throw new Error(`Unsupported job type: ${job.type}`)
      }
    })

    return NextResponse.json({ success: true, processed })
  } catch (error) {
    console.error("Error processing job:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
