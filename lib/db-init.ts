import { getPostgresClient, getSupabaseClient } from "./db-client"
import { logError, ErrorType, ErrorSeverity } from "@/utils/error-handler"
;("use server")

import { createAdminClient } from "@/lib/supabase-client"

// Tables that need to be checked
const requiredTables = [
  "chat_messages",
  "applications",
  "job_alerts",
  "resumes",
  "follow_ups",
  "resume_scores",
  "job_matches",
  "industry_benchmarks",
  "salary_data",
  "optimized_resumes",
  "user_preferences",
  "company_insights",
  "profile_versions",
  "profiles",
]

// List of all required tables
const REQUIRED_TABLES = [
  "profiles",
  "chat_messages",
  "applications",
  "resumes",
  "follow_ups",
  "job_alerts",
  "resume_scores",
  "job_matches",
  "industry_benchmarks",
  "salary_data",
  "optimized_resumes",
  "user_preferences",
  "company_insights",
  "profile_versions",
]

/**
 * Initialize database and create all required tables
 */
export async function initializeDatabase() {
  try {
    // First try with Supabase RPC
    const result = await initWithSupabaseRPC()
    if (result.success) {
      return result
    }

    // If that fails, try with direct Postgres connection
    return await initWithPostgres()
  } catch (error) {
    logError(ErrorType.STORAGE, "Failed to initialize database", ErrorSeverity.CRITICAL, { error })
    return {
      success: false,
      error: error.message,
      created: [],
      message: "Failed to initialize database. See logs for details.",
    }
  }
}

/**
 * Initialize database using Supabase RPC
 */
async function initWithSupabaseRPC() {
  try {
    const supabase = getSupabaseClient()

    // Check which tables exist
    const { data: existingTables, error: checkError } = await supabase.rpc("get_tables")

    if (checkError) {
      // If RPC fails, it might not be available
      return {
        success: false,
        error: checkError.message,
        created: [],
        message: "Failed to check existing tables with RPC",
      }
    }

    const missingTables = REQUIRED_TABLES.filter((table) => !existingTables.includes(table))

    if (missingTables.length === 0) {
      return {
        success: true,
        created: [],
        message: "All required tables already exist",
      }
    }

    // Create missing tables
    const createdTables = []

    for (const table of missingTables) {
      const { error } = await supabase.rpc("create_table", { table_name: table })

      if (!error) {
        createdTables.push(table)
      } else {
        logError(ErrorType.STORAGE, `Failed to create table ${table}`, ErrorSeverity.HIGH, { error })
      }
    }

    return {
      success: createdTables.length === missingTables.length,
      created: createdTables,
      message: `Created ${createdTables.length} of ${missingTables.length} missing tables`,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      created: [],
      message: "Failed to initialize database with Supabase RPC",
    }
  }
}

/**
 * Initialize database using direct Postgres connection
 */
async function initWithPostgres() {
  const pg = getPostgresClient()
  const client = await pg.connect()

  try {
    // Start a transaction
    await client.query("BEGIN")

    // Check which tables exist
    const checkResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)

    const existingTables = checkResult.rows.map((row) => row.table_name)
    const missingTables = REQUIRED_TABLES.filter((table) => !existingTables.includes(table))

    if (missingTables.length === 0) {
      await client.query("COMMIT")
      return {
        success: true,
        created: [],
        message: "All required tables already exist",
      }
    }

    // Create missing tables
    const createdTables = []

    for (const table of missingTables) {
      try {
        await client.query(getTableSchema(table))
        createdTables.push(table)
      } catch (error) {
        logError(ErrorType.STORAGE, `Failed to create table ${table}`, ErrorSeverity.HIGH, { error })
      }
    }

    // Commit transaction
    await client.query("COMMIT")

    return {
      success: createdTables.length === missingTables.length,
      created: createdTables,
      message: `Created ${createdTables.length} of ${missingTables.length} missing tables`,
    }
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

/**
 * Get SQL schema for a specific table
 */
function getTableSchema(tableName: string) {
  const schemas: Record<string, string> = {
    profiles: `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        name TEXT,
        email TEXT,
        preferred_role TEXT,
        location TEXT,
        bio TEXT,
        skills TEXT,
        imported_from TEXT,
        last_optimized TIMESTAMP WITH TIME ZONE
      )
    `,
    chat_messages: `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    applications: `
      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      )
    `,
    resumes: `
      CREATE TABLE IF NOT EXISTS resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    follow_ups: `
      CREATE TABLE IF NOT EXISTS follow_ups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        application_id UUID NOT NULL,
        content TEXT NOT NULL,
        scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
        sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    job_alerts: `
      CREATE TABLE IF NOT EXISTS job_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        job_title TEXT NOT NULL,
        location TEXT,
        keywords TEXT[],
        frequency TEXT NOT NULL DEFAULT 'daily',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    resume_scores: `
      CREATE TABLE IF NOT EXISTS resume_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        resume_id UUID NOT NULL,
        ats_score INTEGER NOT NULL,
        content_score INTEGER NOT NULL,
        format_score INTEGER NOT NULL,
        keyword_score INTEGER NOT NULL,
        overall_score INTEGER NOT NULL,
        industry TEXT,
        job_title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    job_matches: `
      CREATE TABLE IF NOT EXISTS job_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        job_title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        job_description TEXT NOT NULL,
        match_score INTEGER NOT NULL,
        skills_match TEXT[],
        skills_missing TEXT[],
        source_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    industry_benchmarks: `
      CREATE TABLE IF NOT EXISTS industry_benchmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        industry TEXT NOT NULL,
        job_title TEXT NOT NULL,
        avg_ats_score INTEGER NOT NULL,
        avg_content_score INTEGER NOT NULL,
        avg_format_score INTEGER NOT NULL,
        avg_keyword_score INTEGER NOT NULL,
        avg_overall_score INTEGER NOT NULL,
        required_skills TEXT[],
        preferred_skills TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    salary_data: `
      CREATE TABLE IF NOT EXISTS salary_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        industry TEXT NOT NULL,
        job_title TEXT NOT NULL,
        location TEXT NOT NULL,
        experience_level TEXT NOT NULL,
        min_salary INTEGER NOT NULL,
        max_salary INTEGER NOT NULL,
        avg_salary INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    optimized_resumes: `
      CREATE TABLE IF NOT EXISTS optimized_resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        original_resume_id UUID NOT NULL,
        job_title TEXT NOT NULL,
        company TEXT NOT NULL,
        job_description TEXT NOT NULL,
        optimized_content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    user_preferences: `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        preferred_locations TEXT[],
        remoteOnly BOOLEAN DEFAULT false,
        minSalary INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    company_insights: `
      CREATE TABLE IF NOT EXISTS company_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name TEXT NOT NULL UNIQUE,
        culture TEXT,
        salary_range TEXT,
        work_life_balance TEXT,
        growth_opportunities TEXT,
        reviews TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `,
    profile_versions: `
      CREATE TABLE IF NOT EXISTS profile_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL,
        name TEXT,
        preferred_role TEXT,
        location TEXT,
        bio TEXT,
        skills TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_by TEXT NOT NULL DEFAULT 'user',
        version_notes TEXT
      )
    `,
  }

  // Default schema for tables not explicitly defined
  if (!schemas[tableName]) {
    return `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `
  }

  return schemas[tableName]
}

/**
 * Create helper functions in the database
 */
export async function createHelperFunctions() {
  try {
    const pg = getPostgresClient()
    const client = await pg.connect()

    try {
      // Create get_tables function
      await client.query(`
        CREATE OR REPLACE FUNCTION get_tables()
        RETURNS TABLE (table_name text) AS $$
        BEGIN
          RETURN QUERY
          SELECT information_schema.tables.table_name::text
          FROM information_schema.tables
          WHERE table_schema = 'public';
        END;
        $$ LANGUAGE plpgsql;
      `)

      // Create exec_sql function for direct SQL execution
      await client.query(`
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS VOID AS $$
        BEGIN
          EXECUTE sql_query;
        END;
        $$ LANGUAGE plpgsql;
      `)

      // Create pg_query function for direct SQL queries with results
      await client.query(`
        CREATE OR REPLACE FUNCTION pg_query(query_text text)
        RETURNS json AS $$
        DECLARE
          result json;
        BEGIN
          EXECUTE query_text INTO result;
          RETURN result;
        EXCEPTION WHEN OTHERS THEN
          RETURN json_build_object('error', SQLERRM);
        END;
        $$ LANGUAGE plpgsql;
      `)

      return { success: true }
    } finally {
      client.release()
    }
  } catch (error) {
    logError(ErrorType.STORAGE, "Failed to create helper functions", ErrorSeverity.HIGH, { error })
    return { success: false, error: error.message }
  }
}

/**
 * Check if a table exists
 */
export async function tableExists(tableName: string) {
  try {
    const pg = getPostgresClient()
    const client = await pg.connect()

    try {
      const result = await client.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `,
        [tableName],
      )

      return result.rows[0].exists
    } finally {
      client.release()
    }
  } catch (error) {
    logError(ErrorType.STORAGE, `Failed to check if table ${tableName} exists`, ErrorSeverity.MEDIUM, { error })
    return false
  }
}

// Check if tables exist and create them if they don't
export async function ensureDatabaseTables() {
  const supabase = createAdminClient()

  try {
    // We'll use a different approach to check for existing tables
    // Instead of querying information_schema, we'll try to select from each table
    // and catch the error if the table doesn't exist

    const missingTables = []

    for (const table of requiredTables) {
      try {
        // Try to query the table with a limit of 0 to just check if it exists
        const { error } = await supabase.from(table).select("*", { count: "exact", head: true }).limit(0)

        // If there's an error with "relation does not exist", the table is missing
        if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
          missingTables.push(table)
        }
      } catch (err) {
        // If there's an exception, assume the table is missing
        missingTables.push(table)
      }
    }

    if (missingTables.length > 0) {
      console.log("Missing tables:", missingTables)
      await createMissingTables(missingTables)
      return { success: true, created: missingTables }
    }

    return { success: true, created: [] }
  } catch (error) {
    console.error("Error ensuring database tables:", error)
    return { success: false, error }
  }
}

// Create missing tables with basic schema
async function createMissingTables(tables: string[]) {
  const supabase = createAdminClient()

  // Basic schemas for each table
  const tableSchemas: Record<string, string> = {
    profiles: `
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
    `,
    chat_messages: `
      CREATE TABLE IF NOT EXISTS public.chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `,
    applications: `
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
    `,
    resumes: `
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
    job_alerts: `
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
    follow_ups: `
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
    `,
    resume_scores: `
      CREATE TABLE IF NOT EXISTS public.resume_scores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        resume_id UUID NOT NULL,
        ats_score INTEGER NOT NULL,
        content_score INTEGER NOT NULL,
        format_score INTEGER NOT NULL,
        keyword_score INTEGER NOT NULL,
        overall_score INTEGER NOT NULL,
        industry TEXT,
        job_title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `,
    job_matches: `
      CREATE TABLE IF NOT EXISTS public.job_matches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        job_title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        job_description TEXT NOT NULL,
        match_score INTEGER NOT NULL,
        skills_match TEXT[],
        skills_missing TEXT[],
        source_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `,
    industry_benchmarks: `
      CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        industry TEXT NOT NULL,
        job_title TEXT NOT NULL,
        avg_ats_score INTEGER NOT NULL,
        avg_content_score INTEGER NOT NULL,
        avg_format_score INTEGER NOT NULL,
        avg_keyword_score INTEGER NOT NULL,
        avg_overall_score INTEGER NOT NULL,
        required_skills TEXT[],
        preferred_skills TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `,
    salary_data: `
      CREATE TABLE IF NOT EXISTS public.salary_data (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        industry TEXT NOT NULL,
        job_title TEXT NOT NULL,
        location TEXT NOT NULL,
        experience_level TEXT NOT NULL,
        min_salary INTEGER NOT NULL,
        max_salary INTEGER NOT NULL,
        avg_salary INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `,
    optimized_resumes: `
      CREATE TABLE IF NOT EXISTS public.optimized_resumes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        original_resume_id UUID NOT NULL,
        job_title TEXT NOT NULL,
        company TEXT NOT NULL,
        job_description TEXT NOT NULL,
        optimized_content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `,
    user_preferences: `
      CREATE TABLE IF NOT EXISTS public.user_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        preferred_locations TEXT[],
        remoteOnly BOOLEAN DEFAULT false,
        minSalary INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `,
    company_insights: `
      CREATE TABLE IF NOT EXISTS public.company_insights (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_name TEXT NOT NULL UNIQUE,
        culture TEXT,
        salary_range TEXT,
        work_life_balance TEXT,
        growth_opportunities TEXT,
        reviews TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `,
    profile_versions: `
      CREATE TABLE IF NOT EXISTS public.profile_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        profile_id UUID NOT NULL,
        name TEXT,
        preferred_role TEXT,
        location TEXT,
        bio TEXT,
        skills TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_by TEXT NOT NULL DEFAULT 'user',
        version_notes TEXT
      );
    `,
  }

  // Create each missing table using the REST API
  for (const table of tables) {
    if (tableSchemas[table]) {
      try {
        // Use the REST API to execute SQL
        const response = await fetch("/api/execute-sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sql: tableSchemas[table] }),
        })

        const result = await response.json()
        if (!result.success) {
          console.error(`Error with API for ${table}:`, result.error)
        } else {
          console.log(`Created table ${table} using API`)
        }
      } catch (apiErr) {
        console.error(`Error with API for ${table}:`, apiErr)
      }
    }
  }
}

// Create the tables directly using the REST API
export async function createTablesDirectly() {
  try {
    // Create profiles table
    await fetch("/api/execute-sql", {
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
      `,
      }),
    })

    // Create chat_messages table
    await fetch("/api/execute-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: `
        CREATE TABLE IF NOT EXISTS public.chat_messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `,
      }),
    })

    // Create applications table
    await fetch("/api/execute-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: `
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
      `,
      }),
    })

    // Create resumes table
    await fetch("/api/execute-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: `
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

    // Create follow_ups table
    await fetch("/api/execute-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: `
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
      `,
      }),
    })

    // Create job_alerts table
    await fetch("/api/execute-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: `
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

    return { success: true }
  } catch (error) {
    console.error("Exception creating tables directly:", error)
    return { success: false, error }
  }
}
