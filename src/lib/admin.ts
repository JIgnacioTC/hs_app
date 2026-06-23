import type { User } from "@supabase/supabase-js";

function parseList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: Pick<User, "id" | "email"> | null | undefined): boolean {
  if (!user) return false;

  const adminIds = parseList(process.env.HS_ADMIN_USER_IDS);
  const adminEmails = parseList(process.env.HS_ADMIN_EMAILS);

  if (adminIds.includes(user.id.toLowerCase())) return true;
  if (user.email && adminEmails.includes(user.email.toLowerCase())) return true;

  return false;
}
