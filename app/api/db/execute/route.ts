import { NextResponse } from "next/server"
import { getPostgresClient } from "@/lib/db-client"
import { logError, ErrorType, ErrorSeverity } from "@/utils/error-handler"

export async function POST(request: Request) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json(
        {
          success: false,
          message: "SQL query is required",
        },
        { status: 400 },
      )
    }

    const pg = getPostgresClient()
    const client = await pg.connect()

    try {
      const result = await client.query(sql)

      return NextResponse.json({
        success: true,
        rowCount: result.rowCount,
        rows: result.rows,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    logError(ErrorType.STORAGE, "Error executing SQL query", ErrorSeverity.HIGH, { error })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to execute SQL query",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
