import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit, RateLimitType } from "@/utils/rate-limiter"

export async function rateLimitMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  // Get IP address
  const ip = req.headers.get("x-forwarded-for") || "unknown"

  // Check rate limit
  const rateLimitResult = await checkRateLimit({
    limit: 50, // 50 requests
    window: 60 * 60, // per hour
    type: RateLimitType.IP,
    identifier: ip,
  })

  // If rate limit is exceeded
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "50",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          "Retry-After": rateLimitResult.reset.toString(),
        },
      },
    )
  }

  // Add rate limit headers to response
  const response = await handler(req)

  response.headers.set("X-RateLimit-Limit", "50")
  response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
  response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())

  return response
}
