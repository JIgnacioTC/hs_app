import { createAdminClient } from "@/utils/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Server mutations after requireAuth — avoids RLS/auth.uid() mismatches in route handlers. */
export function getSocialAdminClient(): SupabaseClient {
  return createAdminClient();
}
