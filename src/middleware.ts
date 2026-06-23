import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const publicRoutes = ["/auth/login", "/auth/register"];
const publicApiRoutes = ["/api/auth/login", "/api/auth/signup"];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));
  const isPublicApi = publicApiRoutes.some((r) => pathname.startsWith(r));

  if (!user && !isPublic && !isPublicApi && !pathname.startsWith("/api/cron")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && !isPublic && !pathname.startsWith("/api") && pathname !== "/wizard") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wizard_completed")
      .eq("id", user.id)
      .single();

    if (profile && !profile.wizard_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/wizard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
