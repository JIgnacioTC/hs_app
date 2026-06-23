# Supabase Edge Function: dispatch-reminders
# Deploy: supabase functions deploy dispatch-reminders
# Schedule via Supabase Dashboard → Database → Extensions → pg_cron
# or external cron hitting your deployed function

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const APP_URL = Deno.env.get("APP_URL")!;

Deno.serve(async () => {
  const res = await fetch(`${APP_URL}/api/cron/reminders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: res.status,
  });
});
