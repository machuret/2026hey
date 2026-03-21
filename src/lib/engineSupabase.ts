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
): Promise<NextResponse> {
  try {
    const url = new URL(edgeFnUrl(fnName));
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(req),
        apikey: SUPABASE_ANON_KEY!,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
