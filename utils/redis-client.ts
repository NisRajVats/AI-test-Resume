import { Redis } from "@upstash/redis"

// Create a singleton Redis client
let redisClient: Redis | null = null

export function getRedisClient() {
  // Only create the client once
  if (!redisClient) {
    // Check if we have the required environment variables
    if (!process.env.REDIS_URL && !process.env.KV_URL) {
      throw new Error("Redis URL is not defined in environment variables")
    }

    // Initialize the Redis client
    redisClient = new Redis({
      url: process.env.REDIS_URL || process.env.KV_URL || "",
      token: process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || "",
    })
  }

  return redisClient
}

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 60, // 1 hour
  LONG: 60 * 60 * 24, // 1 day
  WEEK: 60 * 60 * 24 * 7, // 1 week
}

// Helper function to generate cache keys
export function generateCacheKey(prefix: string, ...args: any[]): string {
  return `${prefix}:${args.map((arg) => String(arg)).join(":")}`
}
