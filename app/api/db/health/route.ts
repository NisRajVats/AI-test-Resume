import { NextResponse } from "next/server"
import { checkDatabaseHealth } from "@/lib/db-client"
import { logError, ErrorType, ErrorSeverity } from "@/utils/error-handler"

export async function GET() {
  try {
    const health = await checkDatabaseHealth()

    const allHealthy = health.supabase && health.redis && health.postgres

    return NextResponse.json({
      success: true,
      ...health,
      allHealthy,
    })
  } catch (error) {
    logError(ErrorType.STORAGE, "Error in database health check API", ErrorSeverity.MEDIUM, { error })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to check database health",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
