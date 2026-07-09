"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  acceptInviteSchema,
  createOrganizationSchema,
  switchTenantSchema,
  type AcceptInviteInput,
  type CreateOrganizationInput,
  type SwitchTenantInput,
} from "@/lib/validators/organization.schema";
import { ACTIVE_TENANT_COOKIE, AUTH_COOKIE_OPTIONS } from "@/lib/auth/constants";
import { getAuthContext } from "@/lib/auth/session";

export type OrganizationActionResult = {
  error?: string;
  success?: string;
};

export async function createOrganizationAction(
  input: CreateOrganizationInput
): Promise<OrganizationActionResult> {
  const parsed = createOrganizationSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const context = await getAuthContext();
  if (!context) {
    return { error: "You must be logged in to create an organization" };
  }

  const supabase = await createClient();

  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      timezone: parsed.data.timezone,
      contact_email: parsed.data.contactEmail || context.email,
      contact_phone: parsed.data.contactPhone || context.profile.phone,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This organization slug is already taken" };
    }
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenant.id, AUTH_COOKIE_OPTIONS);

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  redirect("/dashboard");
}

export async function switchTenantAction(
  input: SwitchTenantInput
): Promise<OrganizationActionResult> {
  const parsed = switchTenantSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const context = await getAuthContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  const membership = context.memberships.find(
    (m) => m.tenantId === parsed.data.tenantId
  );

  if (!membership) {
    return { error: "You do not have access to this organization" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ACTIVE_TENANT_COOKIE,
    parsed.data.tenantId,
    AUTH_COOKIE_OPTIONS
  );

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: "Organization switched" };
}

export async function acceptInviteAction(
  input: AcceptInviteInput
): Promise<OrganizationActionResult> {
  const parsed = acceptInviteSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const context = await getAuthContext();
  if (!context) {
    redirect(`/login?redirectTo=/invite/${parsed.data.token}`);
  }

  const supabase = await createClient();

  const { data: tenantId, error: rpcError } = await supabase.rpc(
    "accept_tenant_invite",
    { p_token: parsed.data.token }
  );

  if (rpcError) {
    const message = rpcError.message.includes("email mismatch")
      ? "This invite was sent to a different email address"
      : rpcError.message.includes("Invalid or expired")
        ? "This invite is invalid or has expired"
        : rpcError.message;
    return { error: message };
  }

  if (!tenantId) {
    return { error: "Failed to accept invitation" };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, AUTH_COOKIE_OPTIONS);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function joinAsCustomerAction(): Promise<OrganizationActionResult> {
  const context = await getAuthContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  redirect("/dashboard");
}
