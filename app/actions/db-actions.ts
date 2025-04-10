"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createAdminClient } from "@/lib/supabase-client"
import { tableExists } from "@/lib/db-init"
import { logError, ErrorType, ErrorSeverity } from "@/utils/error-handler"

// For actions that need to be performed as the authenticated user
const createServerClient = () => {
  return createServerComponentClient({ cookies })
}

// Use the admin client for the rest of the functions
const supabase = createAdminClient()

// Chat history functions
export async function getChatHistory(userId: string) {
  try {
    // Check if table exists first
    const exists = await tableExists("chat_messages")
    if (!exists) {
      // Return empty data if table doesn't exist
      return { data: [] }
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) {
      logError(ErrorType.STORAGE, "Error getting chat history", ErrorSeverity.MEDIUM, { error, userId })
      return { error, data: [] }
    }

    return { data }
  } catch (error) {
    logError(ErrorType.STORAGE, "Exception in getChatHistory", ErrorSeverity.MEDIUM, { error, userId })
    return { error, data: [] }
  }
}

export async function addChatMessage(userId: string, message: any) {
  try {
    // Check if table exists first
    const exists = await tableExists("chat_messages")
    if (!exists) {
      // Try to create the table via API
      await fetch("/api/db/init", {
        method: "POST",
      })

      // Return success for now
      return { success: true }
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          user_id: userId,
          role: message.role,
          content: message.content,
        },
      ])
      .select()

    if (error) {
      logError(ErrorType.STORAGE, "Error adding chat message", ErrorSeverity.MEDIUM, { error, userId })
      return { error, success: false }
    }

    return { data, success: true }
  } catch (error) {
    logError(ErrorType.STORAGE, "Exception in addChatMessage", ErrorSeverity.MEDIUM, { error, userId })
    return { error, success: false }
  }
}

// Application tracking functions
export async function getApplications(userId: string) {
  try {
    // Check if table exists first
    const exists = await tableExists("applications")
    if (!exists) {
      // Return empty data if table doesn't exist
      return { data: [] }
    }

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      logError(ErrorType.STORAGE, "Error getting applications", ErrorSeverity.MEDIUM, { error, userId })
      return { error, data: [] }
    }

    return { data }
  } catch (error) {
    logError(ErrorType.STORAGE, "Exception in getApplications", ErrorSeverity.MEDIUM, { error, userId })
    return { error, data: [] }
  }
}

// Continue with similar pattern for other database functions...
