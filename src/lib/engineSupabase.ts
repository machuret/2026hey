import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

/** Anon client — for read operations */
export function getEngineClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/** Service-role client — for all mutations in API routes */
export function getEngineAdmin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export function edgeFnUrl(name: string) {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}
