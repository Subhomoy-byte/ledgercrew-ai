import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client using the SERVICE ROLE key — it bypasses Row-Level
 * Security entirely, so it must only ever run on the server.
 *
 * The `server-only` import above makes the build FAIL if this file is ever
 * imported (directly or indirectly) from a Client Component, so the key
 * can't be bundled into browser JavaScript by accident.
 *
 * Returns null when the key isn't configured, so callers can show a clear
 * message instead of crashing.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
