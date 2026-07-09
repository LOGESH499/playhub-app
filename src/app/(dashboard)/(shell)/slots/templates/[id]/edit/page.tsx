import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageSlots,
  getResourcesForSlotForm,
  getSlotTemplateById,
  getVenuesForSlotForm,
} from "@/features/slots/lib/queries";
import { SlotTemplateForm } from "@/features/slots";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Edit slot template",
};

export const dynamic = "force-dynamic";

interface EditSlotTemplatePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditSlotTemplatePage({
  params,
  searchParams,
}: EditSlotTemplatePageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/slots/templates");

  if (!context.activeTenant) redirect("/onboarding");

  if (!canManageSlots(context.appRole)) redirect("/slots");

  const { id } = await params;
  const raw = await searchParams;
  const created = raw.created === "1";

  const [template, venues, resources] = await Promise.all([
    getSlotTemplateById(id),
    getVenuesForSlotForm(),
    getResourcesForSlotForm(),
  ]);

  if (!template) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit template</h1>
        <p className="mt-1 text-sm text-muted-foreground">{template.name}</p>
      </div>

      {created && (
        <Alert variant="success">Template created successfully.</Alert>
      )}

      <SlotTemplateForm
        mode="edit"
        template={template}
        venues={venues}
        resources={resources}
      />
    </div>
  );
}
