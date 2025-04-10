import { getRedisClient } from "./redis-client"

export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface Job {
  id: string
  type: string
  data: any
  status: JobStatus
  createdAt: number
  updatedAt: number
  result?: any
  error?: string
}

export async function enqueueJob(type: string, data: any): Promise<string> {
  const redis = getRedisClient()

  // Generate job ID
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // Create job
  const job: Job = {
    id: jobId,
    type,
    data,
    status: JobStatus.PENDING,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  // Add to queue
  await redis.lpush("job_queue", job)

  // Store job details
  await redis.set(`job:${jobId}`, job)

  return jobId
}

export async function getJob(jobId: string): Promise<Job | null> {
  const redis = getRedisClient()
  return redis.get<Job>(`job:${jobId}`)
}

export async function updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
  const redis = getRedisClient()

  // Get current job
  const job = await redis.get<Job>(`job:${jobId}`)

  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }

  // Update job
  const updatedJob: Job = {
    ...job,
    ...updates,
    updatedAt: Date.now(),
  }

  // Save updated job
  await redis.set(`job:${jobId}`, updatedJob)
}

export async function processNextJob(jobTypes: string[], processor: (job: Job) => Promise<any>): Promise<boolean> {
  const redis = getRedisClient()

  // Get next job
  const jobData = await redis.rpop("job_queue")

  if (!jobData) {
    return false
  }

  const job = jobData as Job

  // Check if job type is supported
  if (!jobTypes.includes(job.type)) {
    // Put back in queue
    await redis.lpush("job_queue", job)
    return false
  }

  try {
    // Update job status
    await updateJob(job.id, { status: JobStatus.PROCESSING })

    // Process job
    const result = await processor(job)

    // Update job with result
    await updateJob(job.id, {
      status: JobStatus.COMPLETED,
      result,
    })

    return true
  } catch (error) {
    // Update job with error
    await updateJob(job.id, {
      status: JobStatus.FAILED,
      error: error instanceof Error ? error.message : String(error),
    })

    return false
  }
}
