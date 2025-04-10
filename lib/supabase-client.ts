import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Singleton pattern for client-side Supabase client
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Server-side - create a new instance each time
    return createClientComponentClient<Database>()
  }

  // Client-side - use singleton pattern
  if (!clientInstance) {
    clientInstance = createClientComponentClient<Database>()
  }

  return clientInstance
}

// For server-side operations with admin privileges
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL and service key are required")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}
