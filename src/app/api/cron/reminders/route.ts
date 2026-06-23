import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { shouldSendReminder, reminderDeepLink } from "@/lib/cron";
import { sendPushNotification } from "@/lib/push";

function authorizeCron(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === cronSecret;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("*, push_subscriptions(*)")
    .eq("enabled", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const reminder of reminders ?? []) {
    if (!shouldSendReminder(reminder.cron_expression, reminder.timezone, reminder.last_sent_at, now)) {
      continue;
    }

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", reminder.user_id);

    if (!subs?.length) continue;

    for (const sub of subs) {
      try {
        await sendPushNotification(sub, {
          title: reminder.title,
          body: reminder.body || "Recordatorio HS",
          url: reminderDeepLink(reminder.linked_type, reminder.linked_id),
        });
        sent++;
      } catch (e) {
        errors.push(String(e));
        if (String(e).includes("410") || String(e).includes("404")) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    await supabase
      .from("reminders")
      .update({ last_sent_at: now.toISOString() })
      .eq("id", reminder.id);
  }

  return NextResponse.json({ sent, errors: errors.length, timestamp: now.toISOString() });
}

export async function GET(request: Request) {
  return POST(request);
}
