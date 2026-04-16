import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Service-role client — for all mutations in API routes */
export function getEngineAdmin() {
  const key = SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY!;
  return createClient(SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}

export function edgeFnUrl(name: string) {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

/** Extracts the Bearer token from the incoming request to forward to edge functions */
export function getAuthHeader(req: NextRequest): string {
  return (
    req.headers.get("authorization") ??
    `Bearer ${SUPABASE_ANON_KEY}`
  );
}

/** Proxies a request to a Supabase edge function and returns a NextResponse */
export async function proxyEdgeFn(
  fnName: string,
  method: string,
  req: NextRequest,
  searchParams: Record<string, string> = {},
  body?: unknown,
  timeoutMs = 290_000,
): Promise<NextResponse> {
  const url = new URL(edgeFnUrl(fnName));
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));

  // Always use service role key — edge functions verify against it server-side
  const authKey = SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY!;

  if (!SUPABASE_URL) {
    return NextResponse.json(
      { error: `[config] SUPABASE_URL is not set — edge function ${fnName} cannot be reached` },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authKey}`,
        apikey: SUPABASE_ANON_KEY!,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    // Try to parse JSON; some errors (404, 502) return HTML
    let data: unknown;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { error: `[${fnName}] HTTP ${res.status}: ${text.slice(0, 300)}` };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error && err.name === "TimeoutError"
      ? `[${fnName}] Edge function timed out after ${Math.round(timeoutMs / 1000)}s`
      : `[${fnName}] Edge function unreachable: ${err instanceof Error ? err.message : String(err)}`;
    console.error(msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
