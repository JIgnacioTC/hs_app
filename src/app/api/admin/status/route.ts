import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { isAdminUser } from "@/lib/admin";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  return NextResponse.json({ is_admin: isAdminUser(user) });
}
