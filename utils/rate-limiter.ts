import { getRedisClient } from "./redis-client"

export enum RateLimitType {
  IP = "ip",
  USER = "user",
  GLOBAL = "global",
}

interface RateLimitOptions {
  // Maximum number of requests allowed in the time window
  limit: number
  // Time window in seconds
  window: number
  // Type of rate limit
  type: RateLimitType
  // Identifier (user ID, IP address, etc.)
  identifier: string
}

export async function checkRateLimit({ limit, window, type, identifier }: RateLimitOptions): Promise<{
  success: boolean
  remaining: number
  reset: number
}> {
  try {
    const redis = getRedisClient()
    const key = `ratelimit:${type}:${identifier}`

    // Get current count
    const count = (await redis.get<number>(key)) || 0

    // Check if limit is exceeded
    if (count >= limit) {
      // Get TTL of the key
      const ttl = await redis.ttl(key)
      return {
        success: false,
        remaining: 0,
        reset: ttl,
      }
    }

    // Increment count
    await redis.incr(key)

    // Set expiry if it's a new key
    if (count === 0) {
      await redis.expire(key, window)
    }

    // Get TTL of the key
    const ttl = await redis.ttl(key)

    return {
      success: true,
      remaining: limit - (count + 1),
      reset: ttl,
    }
  } catch (error) {
    console.error("Rate limit error:", error)
    // If Redis fails, allow the request
    return {
      success: true,
      remaining: 1,
      reset: 0,
    }
  }
}
