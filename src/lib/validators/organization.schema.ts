import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name is too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only"
    ),
  timezone: z.string().min(1, "Timezone is required"),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
});

export const switchTenantSchema = z.object({
  tenantId: z.string().uuid("Invalid organization"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type SwitchTenantInput = z.infer<typeof switchTenantSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export function slugifyOrganizationName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
