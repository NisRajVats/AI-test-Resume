"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function InitDatabase() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const initDb = async () => {
      try {
        // Create favicon first
        await fetch("/api/favicon").catch((err) => console.error("Error creating favicon:", err))

        // Then initialize the database
        const response = await fetch("/api/db-init")
        const data = await response.json()

        if (data.success) {
          setInitialized(true)
          console.log("Database initialized successfully")
        } else {
          setError(data.error || "Unknown error initializing database")
          console.error("Error initializing database:", data.error)

          // Try a direct SQL approach as fallback
          try {
            const sqlResponse = await fetch("/api/execute-sql", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sql: `
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
                  
                  CREATE TABLE IF NOT EXISTS public.chat_messages (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                  );
                  
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
                  
                  CREATE TABLE IF NOT EXISTS public.resumes (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID NOT NULL,
                    file_name TEXT NOT NULL,
                    file_url TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                  );
                `,
              }),
            })

            const sqlData = await sqlResponse.json()
            if (sqlData.success) {
              setInitialized(true)
              console.log("Database initialized successfully via SQL")
            } else {
              console.error("Error initializing database via SQL:", sqlData.error)
            }
          } catch (sqlErr) {
            console.error("Error with SQL initialization:", sqlErr)
          }
        }
      } catch (error) {
        setError(String(error))
        console.error("Error initializing:", error)

        // Show toast for error
        toast({
          title: "Database Initialization Error",
          description: "There was an error initializing the database. Some features may not work correctly.",
          variant: "destructive",
        })
      }
    }

    initDb()
  }, [toast])

  // This component doesn't render anything
  return null
}
