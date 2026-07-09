import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";
import {
  AUTH_ROUTES,
  getPostLoginRedirect,
  isAuthRoute,
  isPlatformRoute,
  isProtectedRoute,
  PROTECTED_ROUTES,
} from "@/lib/constants/routes";

type CookieToSet = { name: string; value: string; options: CookieOptions };

type ProfileAdminRow = { is_platform_admin: boolean };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project")) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isEmailVerified = Boolean(user?.email_confirmed_at);

  const isInviteRoute = pathname.startsWith("/invite/");
  const requiresAuth =
    isProtectedRoute(pathname) || isPlatformRoute(pathname) || isInviteRoute;

  if (!user && requiresAuth) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTES.login;
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !isEmailVerified) {
    const allowedUnverified =
      isAuthRoute(pathname) ||
      pathname === AUTH_ROUTES.verifyEmail ||
      pathname.startsWith("/auth/callback");

    if (!allowedUnverified && requiresAuth) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = AUTH_ROUTES.verifyEmail;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && isPlatformRoute(pathname)) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", user.id)
      .single();

    const profile = profileRow as ProfileAdminRow | null;

    if (!profile?.is_platform_admin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = PROTECTED_ROUTES.dashboard;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (
    user &&
    isAuthRoute(pathname) &&
    !pathname.startsWith("/auth/callback") &&
    pathname !== AUTH_ROUTES.verifyEmail
  ) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", user.id)
      .single();

    const profile = profileRow as ProfileAdminRow | null;

    const { count } = await supabase
      .from("tenant_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = getPostLoginRedirect(
      profile?.is_platform_admin ?? false,
      (count ?? 0) > 0
    );
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === PROTECTED_ROUTES.onboarding) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", user.id)
      .single();

    const profile = profileRow as ProfileAdminRow | null;

    if (profile?.is_platform_admin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = getPostLoginRedirect(true, false);
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    const { count } = await supabase
      .from("tenant_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    if ((count ?? 0) > 0) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = PROTECTED_ROUTES.dashboard;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
