"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  SUPABASE_CONFIG_MESSAGE,
} from "@/lib/supabase/config";
import {
  forgotPasswordSchema,
  loginSchema,
  magicLinkSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type MagicLinkInput,
  type RegisterInput,
  type ResetPasswordInput,
  type UpdateProfileInput,
} from "@/lib/validators/auth.schema";
import type { TablesUpdate } from "@/types/database.types";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { getPostLoginRedirect } from "@/lib/constants/routes";
import { getTenantMemberships } from "@/lib/auth/session";

export type AuthActionResult = {
  error?: string;
  success?: string;
};

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function supabaseConfigError(): AuthActionResult | null {
  if (!isSupabaseConfigured()) {
    return { error: SUPABASE_CONFIG_MESSAGE };
  }
  return null;
}

async function redirectAfterLogin(redirectTo?: string) {
  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  const memberships = await getTenantMemberships(user.id);

  redirect(
    getPostLoginRedirect(
      profile?.is_platform_admin ?? false,
      memberships.length > 0
    )
  );
}

export async function loginAction(
  input: LoginInput,
  redirectTo?: string
): Promise<AuthActionResult | void> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const configError = supabaseConfigError();
  if (configError) return configError;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  await redirectAfterLogin(redirectTo);
}

export async function registerAction(
  input: RegisterInput
): Promise<AuthActionResult | void> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const configError = supabaseConfigError();
  if (configError) return configError;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user && !data.session) {
    redirect("/verify-email");
  }

  redirect("/onboarding");
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const configError = supabaseConfigError();
  if (configError) return configError;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${getAppUrl()}/auth/callback?type=recovery` }
  );

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "If an account exists for that email, you will receive a password reset link shortly.",
  };
}

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<AuthActionResult | void> {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const configError = supabaseConfigError();
  if (configError) return configError;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_TENANT_COOKIE);

  redirect("/login");
}

export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<AuthActionResult> {
  const parsed = updateProfileSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const configError = supabaseConfigError();
  if (configError) return configError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to update your profile" };
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName, phone: parsed.data.phone || null },
  });

  if (authError) {
    return { error: authError.message };
  }

  const profileUpdate: TablesUpdate<"profiles"> = {
    full_name: parsed.data.fullName,
    phone: parsed.data.phone || null,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/profile");
  return { success: "Profile updated successfully" };
}

export async function signInWithMagicLinkAction(
  input: MagicLinkInput
): Promise<AuthActionResult> {
  const parsed = magicLinkSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const configError = supabaseConfigError();
  if (configError) return configError;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Check your email for a magic link to sign in.",
  };
}

export async function resendVerificationEmailAction(): Promise<AuthActionResult> {
  const configError = supabaseConfigError();
  if (configError) return configError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "You must be logged in with an email address" };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Verification email sent. Please check your inbox." };
}

export async function signInWithGoogleAction() {
  if (!isSupabaseConfigured()) {
    redirect(`/login?error=${encodeURIComponent(SUPABASE_CONFIG_MESSAGE)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}
