import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageSlots,
  listSlotTemplates,
} from "@/features/slots/lib/queries";
import { SlotTemplatesTable } from "@/features/slots";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Slot templates",
};

export const dynamic = "force-dynamic";

export default async function SlotTemplatesPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/slots/templates");

  if (!context.activeTenant) redirect("/onboarding");

  if (!canManageSlots(context.appRole)) redirect("/slots");

  const templates = await listSlotTemplates();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Slot templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recurring patterns for bulk slot generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/slots">Back to slots</Link>
          </Button>
          <Button asChild>
            <Link href="/slots/templates/new">
              <Plus className="h-4 w-4" />
              New template
            </Link>
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No templates yet. Create one to generate recurring weekly slots.
          </CardContent>
        </Card>
      ) : (
        <SlotTemplatesTable templates={templates} canManage />
      )}
    </div>
  );
}
