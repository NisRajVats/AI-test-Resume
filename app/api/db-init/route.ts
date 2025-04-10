import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create tables using the REST API
    const response = await fetch("/api/execute-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: `
          -- Create profiles table
          CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID PRIMARY KEY,
            name TEXT,
            email TEXT,
            preferred_role TEXT,
            location TEXT,
            bio TEXT,
            skills TEXT,
            imported_from TEXT,
            last_optimized TIMESTAMP WITH TIME ZONE
          );
          
          -- Create chat_messages table
          CREATE TABLE IF NOT EXISTS public.chat_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Create applications table
          CREATE TABLE IF NOT EXISTS public.applications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            company TEXT NOT NULL,
            position TEXT NOT NULL,
            location TEXT,
            status TEXT NOT NULL,
            date_applied TIMESTAMP WITH TIME ZONE NOT NULL,
            notes TEXT,
            link TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Create resumes table
          CREATE TABLE IF NOT EXISTS public.resumes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            file_name TEXT NOT NULL,
            file_url TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Create follow_ups table
          CREATE TABLE IF NOT EXISTS public.follow_ups (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            application_id UUID NOT NULL,
            content TEXT NOT NULL,
            scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
            sent BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Create job_alerts table
          CREATE TABLE IF NOT EXISTS public.job_alerts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            job_title TEXT NOT NULL,
            location TEXT,
            keywords TEXT[],
            frequency TEXT NOT NULL DEFAULT 'daily',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `,
      }),
    })

    const result = await response.json()
    if (!result.success) {
      console.error("Error creating tables:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Exception in db-init route:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { table, schema } = await request.json()

    if (!table || !schema) {
      return NextResponse.json({ success: false, error: "Missing table or schema" }, { status: 400 })
    }

    // Execute the SQL directly using the REST API
    const response = await fetch("/api/execute-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql: schema }),
    })

    const result = await response.json()
    if (!result.success) {
      console.error(`Error creating table ${table}:`, result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, table })
  } catch (error) {
    console.error("Exception in db-init POST route:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
