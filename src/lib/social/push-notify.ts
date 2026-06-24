import { sendPushNotification } from "@/lib/push";
import { createAdminClient } from "@/utils/supabase/admin";

export async function notifyUserPush(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  for (const sub of subs) {
    try {
      await sendPushNotification(sub, payload);
    } catch {
      await admin.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }
}

export async function getDisplayName(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name?.trim() || "Alguien";
}
