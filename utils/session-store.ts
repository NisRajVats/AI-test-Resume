import { getRedisClient, CACHE_TTL } from "./redis-client"

export async function setSession(sessionId: string, data: any, ttl = CACHE_TTL.MEDIUM): Promise<void> {
  const redis = getRedisClient()
  await redis.set(`session:${sessionId}`, data, { ex: ttl })
}

export async function getSession<T = any>(sessionId: string): Promise<T | null> {
  const redis = getRedisClient()
  return redis.get<T>(`session:${sessionId}`)
}

export async function deleteSession(sessionId: string): Promise<void> {
  const redis = getRedisClient()
  await redis.del(`session:${sessionId}`)
}

export async function extendSession(sessionId: string, ttl = CACHE_TTL.MEDIUM): Promise<void> {
  const redis = getRedisClient()
  await redis.expire(`session:${sessionId}`, ttl)
}
