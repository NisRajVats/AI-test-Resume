import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Only accept errors from authenticated users
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const errorData = await request.json()

    // Add user ID to error context
    errorData.context = {
      ...errorData.context,
      userId: session.user.id,
    }

    // In a real implementation, you would store this in a database
    console.error("Client error logged:", errorData)

    // Example of storing in Supabase
    // const { error } = await supabase
    //   .from('error_logs')
    //   .insert([{
    //     user_id: session.user.id,
    //     error_type: errorData.type,
    //     error_message: errorData.message,
    //     severity: errorData.severity,
    //     context: errorData.context,
    //     timestamp: new Date().toISOString()
    //   }])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging client error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
