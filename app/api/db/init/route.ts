import { NextResponse } from "next/server"
import { initializeDatabase, createHelperFunctions } from "@/lib/db-init"
import { logError, ErrorType, ErrorSeverity } from "@/utils/error-handler"

export async function POST() {
  try {
    // First create helper functions
    const helperResult = await createHelperFunctions()

    if (!helperResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create helper functions",
          error: helperResult.error,
        },
        { status: 500 },
      )
    }

    // Then initialize the database
    const result = await initializeDatabase()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Failed to initialize database",
          error: result.error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      created: result.created,
    })
  } catch (error) {
    logError(ErrorType.STORAGE, "Error in database initialization API", ErrorSeverity.HIGH, { error })

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during database initialization",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
