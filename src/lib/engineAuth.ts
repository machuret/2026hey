import { NextRequest, NextResponse } from "next/server";

/**
 * Validate engine API request.
 * Engine routes are internal tools — require same admin_token cookie used by /admin.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function requireEngineAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    // If ADMIN_SECRET is not configured, allow through (dev mode)
    return null;
  }

  const token = req.cookies.get("admin_token")?.value;
  if (token === secret) return null;

  // Also accept Bearer token in Authorization header (for programmatic access)
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
