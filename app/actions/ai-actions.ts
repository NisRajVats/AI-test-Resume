import OpenAI from "openai"

// In-memory cache for AI responses
const aiResponseCache = new Map<string, { text: string; timestamp: number }>()

// Cache for 1 hour
const CACHE_TTL = 60 * 60 * 1000

// Singleton OpenAI client
let openaiClient: OpenAI | null = null

// Initialize OpenAI client (server-side only)
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

// Function to generate text using OpenAI
export async function generateAIResponse(prompt: string, systemPrompt?: string) {
  try {
    // Create a cache key based on the prompt and system prompt
    const cacheKey = `${prompt}_${systemPrompt || ""}`

    // Check if we have a cached response
    const cachedResponse = aiResponseCache.get(cacheKey)
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      return { text: cachedResponse.text }
    }

    // Initialize OpenAI client (server-side only)
    const openai = getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use gpt-3.5-turbo for faster response and lower cost
      messages: [
        {
          role: "system",
          content:
            systemPrompt ||
            "You are a helpful career assistant that provides advice on resumes, job applications, interviews, and career development.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const text = response.choices[0].message.content || ""

    // Cache the response
    aiResponseCache.set(cacheKey, {
      text,
      timestamp: Date.now(),
    })

    return { text }
  } catch (error) {
    console.error("Error generating AI response:", error)
    return {
      text: "I apologize, but I encountered an error processing your request. Please try again later.",
      error: true,
    }
  }
}

// Function to analyze a resume
export async function analyzeResume(resumeText: string) {
  try {
    // Truncate resume text to reduce token usage
    const truncatedResumeText = resumeText.substring(0, 2000)

    const systemPrompt = `
      You are an expert resume analyzer and career coach. 
      Analyze the provided resume and provide detailed feedback on the following aspects:
      1. Overall structure and formatting
      2. Professional summary/objective
      3. Work experience descriptions (use of action verbs, quantifiable achievements)
      4. Skills section (relevance, organization)
      5. Education section
      6. Specific improvement suggestions
      7. List of skills extracted from the resume
      
      Format your response in a structured way that's easy to read.
      BE CONCISE.
    `

    return await generateAIResponse(truncatedResumeText, systemPrompt)
  } catch (error) {
    console.error("Error analyzing resume:", error)
    return {
      text: "I apologize, but I encountered an error analyzing your resume. Please try again later.",
      error: true,
    }
  }
}

// Function to conduct a mock interview
export async function conductMockInterview(jobRole: string, question: string, answer?: string) {
  try {
    let prompt = ""
    let systemPrompt = ""

    if (!answer) {
      // Generate interview question
      systemPrompt = `
        You are an expert interviewer for ${jobRole} positions.
        Generate a challenging but common interview question for this role.
        The question should be specific enough to test the candidate's knowledge and experience.
        BE CONCISE.
      `
      prompt = `Generate a single interview question for a ${jobRole} position.`
    } else {
      // Evaluate answer
      systemPrompt = `
        You are an expert interviewer and career coach for ${jobRole} positions.
        Evaluate the candidate's answer to the interview question and provide constructive feedback.
        Include strengths, areas for improvement, and suggestions for a better response.
        Be encouraging but honest in your assessment.
        BE CONCISE.
      `
      prompt = `
        Question: ${question}
        
        Candidate's Answer: ${answer}
        
        Please evaluate this answer for a ${jobRole} position interview.
      `
    }

    return await generateAIResponse(prompt, systemPrompt)
  } catch (error) {
    console.error("Error in mock interview:", error)
    return {
      text: "I apologize, but I encountered an error processing your interview. Please try again later.",
      error: true,
    }
  }
}

// Function to analyze a job posting
export async function analyzeJobPosting(jobDescription: string, resume: string) {
  try {
    const systemPrompt = `
      You are an expert job application analyst. Compare the job description with the resume and provide a match score (0-100),
      a list of skills that match, a list of missing skills, and a detailed analysis.
      Return the response in JSON format.
    `

    const prompt = `
      Job Description: ${jobDescription}
      Resume: ${resume}
      Analyze the job description and resume.
    `

    return await generateAIResponse(prompt, systemPrompt)
  } catch (error) {
    console.error("Error analyzing job posting:", error)
    return {
      text: "I apologize, but I encountered an error analyzing the job posting. Please try again later.",
      error: true,
    }
  }
}

// Remove the direct initialization of openai and export the function instead
export { getOpenAIClient }
