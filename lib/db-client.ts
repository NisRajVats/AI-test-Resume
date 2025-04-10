import { createClient } from "@supabase/supabase-js"
import { Redis } from "@upstash/redis"
import { Pool } from "pg"
import { logError, ErrorType, ErrorSeverity } from "@/utils/error-handler"

// Singleton instances
let supabaseClient: ReturnType<typeof createClient> | null = null
let redisClient: Redis | null = null
let pgPool: Pool | null = null

// Connection status tracking
const connectionStatus = {
  supabase: false,
  redis: false,
  postgres: false,
}

/**
 * Get Supabase client with error handling
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase URL or key is missing")
      }

      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })

      connectionStatus.supabase = true
    } catch (error) {
      logError(ErrorType.STORAGE, "Failed to initialize Supabase client", ErrorSeverity.HIGH, { error })
      // Return a dummy client that logs errors
      return createDummySupabaseClient()
    }
  }
  return supabaseClient
}

/**
 * Get Redis client with error handling
 */
export function getRedisClient() {
  if (!redisClient) {
    try {
      // Check for different possible environment variable names
      const redisUrl = process.env.REDIS_URL || process.env.KV_URL
      const redisToken = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN

      if (!redisUrl) {
        throw new Error("Redis URL is missing")
      }

      redisClient = new Redis({
        url: redisUrl,
        token: redisToken || "",
      })

      connectionStatus.redis = true
    } catch (error) {
      logError(ErrorType.STORAGE, "Failed to initialize Redis client", ErrorSeverity.HIGH, { error })
      // Return a dummy client that logs errors
      return createDummyRedisClient()
    }
  }
  return redisClient
}

/**
 * Get Postgres client with error handling
 */
export function getPostgresClient() {
  if (!pgPool) {
    try {
      // Check for different possible environment variable names
      const pgUrl = process.env.NEON_NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL || process.env.DATABASE_URL

      if (!pgUrl) {
        throw new Error("Postgres URL is missing")
      }

      pgPool = new Pool({
        connectionString: pgUrl,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      })

      connectionStatus.postgres = true
    } catch (error) {
      logError(ErrorType.STORAGE, "Failed to initialize Postgres client", ErrorSeverity.HIGH, { error })
      // Return a dummy client that logs errors
      return createDummyPgClient()
    }
  }
  return pgPool
}

/**
 * Check health of all database connections
 */
export async function checkDatabaseHealth() {
  const health = {
    supabase: false,
    redis: false,
    postgres: false,
    errors: [] as string[],
  }

  // Check Supabase
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("health_check").select("*").limit(1)
    if (error) throw error
    health.supabase = true
  } catch (error) {
    health.errors.push(`Supabase: ${error.message}`)
  }

  // Check Redis
  try {
    const redis = getRedisClient()
    await redis.ping()
    health.redis = true
  } catch (error) {
    health.errors.push(`Redis: ${error.message}`)
  }

  // Check Postgres
  try {
    const pg = getPostgresClient()
    const client = await pg.connect()
    await client.query("SELECT 1")
    client.release()
    health.postgres = true
  } catch (error) {
    health.errors.push(`Postgres: ${error.message}`)
  }

  return health
}

/**
 * Reset all database connections
 */
export function resetConnections() {
  supabaseClient = null
  redisClient = null
  if (pgPool) {
    pgPool.end()
    pgPool = null
  }

  connectionStatus.supabase = false
  connectionStatus.redis = false
  connectionStatus.postgres = false
}

// Dummy clients for graceful degradation
function createDummySupabaseClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: new Error("Supabase connection failed") }),
          limit: async () => ({ data: [], error: new Error("Supabase connection failed") }),
        }),
        limit: async () => ({ data: [], error: new Error("Supabase connection failed") }),
      }),
      insert: () => ({
        select: async () => ({ data: null, error: new Error("Supabase connection failed") }),
      }),
      update: () => ({
        eq: () => ({
          select: async () => ({ data: null, error: new Error("Supabase connection failed") }),
        }),
      }),
      delete: () => ({
        eq: async () => ({ error: new Error("Supabase connection failed") }),
      }),
    }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error("Supabase connection failed") }),
      signUp: async () => ({ data: { user: null }, error: new Error("Supabase connection failed") }),
      signInWithPassword: async () => ({ data: { user: null }, error: new Error("Supabase connection failed") }),
      signOut: async () => ({ error: new Error("Supabase connection failed") }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error("Supabase connection failed") }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  }
}

function createDummyRedisClient() {
  return {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    incr: async () => 1,
    expire: async () => true,
    ttl: async () => 0,
    ping: async () => {
      throw new Error("Redis connection failed")
    },
  }
}

function createDummyPgClient() {
  return {
    connect: async () => {
      throw new Error("Postgres connection failed")
    },
    query: async () => {
      throw new Error("Postgres connection failed")
    },
    end: async () => {},
  }
}

// Export connection status for monitoring
export { connectionStatus }
