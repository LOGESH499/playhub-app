import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginRedirect } from "@/lib/constants/routes";
import { getTenantMemberships } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const supabase = await createClient();

  async function resolveRedirect(): Promise<string> {
    if (next && next.startsWith("/")) {
      return next;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return "/login";
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", user.id)
      .single();

    const memberships = await getTenantMemberships(user.id);

    return getPostLoginRedirect(
      profile?.is_platform_admin ?? false,
      memberships.length > 0
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    const destination = await resolveRedirect();
    return NextResponse.redirect(`${origin}${destination}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "recovery" | "signup" | "magiclink",
    });

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    const destination = await resolveRedirect();
    return NextResponse.redirect(`${origin}${destination}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
