import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Simple 1x1 transparent ICO file (hex)
const FAVICON_HEX =
  "00000100010010100000010020006804000016000000280000001000000020000000010020000000000000040000000000000000000000"

export async function GET() {
  try {
    // Create the public directory if it doesn't exist
    const publicDir = path.join(process.cwd(), "public")
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    // Create favicon.ico file
    const faviconPath = path.join(publicDir, "favicon.ico")

    // Check if favicon already exists
    if (!fs.existsSync(faviconPath)) {
      // Convert hex to buffer
      const buffer = Buffer.from(FAVICON_HEX, "hex")

      // Write the file
      fs.writeFileSync(faviconPath, buffer)
    }

    return NextResponse.json({ success: true, message: "Favicon created successfully" })
  } catch (error) {
    console.error("Error creating favicon:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
