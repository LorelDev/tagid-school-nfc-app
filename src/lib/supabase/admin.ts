import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Admin client using the service role key. SERVER ONLY — bypasses RLS.
// Used for the anonymous student flow (join, submit) where there is no auth user.
export function createAdminClient() {
  return createSupabaseClient(env.supabaseUrl(), env.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
