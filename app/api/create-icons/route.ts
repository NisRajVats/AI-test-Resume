import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Create the icons directory if it doesn't exist
    const iconsDir = path.join(process.cwd(), "public", "icons")
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true })
    }

    // Create a simple favicon.ico file if it doesn't exist
    const faviconPath = path.join(process.cwd(), "public", "favicon.ico")
    if (!fs.existsSync(faviconPath)) {
      // Create a simple 1x1 transparent PNG
      const transparentPixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64",
      )
      fs.writeFileSync(faviconPath, transparentPixel)
    }

    // Create icon-192x192.png if it doesn't exist
    const icon192Path = path.join(iconsDir, "icon-192x192.png")
    if (!fs.existsSync(icon192Path)) {
      // Create a simple 192x192 transparent PNG
      const transparentPixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64",
      )
      fs.writeFileSync(icon192Path, transparentPixel)
    }

    // Create icon-512x512.png if it doesn't exist
    const icon512Path = path.join(iconsDir, "icon-512x512.png")
    if (!fs.existsSync(icon512Path)) {
      // Create a simple 512x512 transparent PNG
      const transparentPixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64",
      )
      fs.writeFileSync(icon512Path, transparentPixel)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating icons:", error)
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}
