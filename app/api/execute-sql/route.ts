import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-client"

export async function POST(req: Request) {
  try {
    const { sql } = await req.json()

    if (!sql) {
      return NextResponse.json({ success: false, error: "SQL query is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Execute the SQL directly using the REST API
    const { data, error } = await supabase.rpc("rest_exec", { query_text: sql })

    if (error) {
      console.error("Error executing SQL:", error)

      // Try a different approach if the RPC fails
      try {
        // Use the raw REST API to execute SQL
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/rest_exec`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
          },
          body: JSON.stringify({ query_text: sql }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          return NextResponse.json({ success: false, error: errorData }, { status: 500 })
        }

        const result = await response.json()
        return NextResponse.json({ success: true, data: result })
      } catch (fetchError) {
        return NextResponse.json({ success: false, error: String(fetchError) }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in execute-sql route:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
