"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteSlotTemplateAction } from "@/features/slots/actions/slot.actions";
import type { SlotTemplate } from "@/features/slots/lib/types";
import { DAY_LABELS_SHORT } from "@/lib/validators/slot.schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SlotTemplatesTableProps {
  templates: SlotTemplate[];
  canManage?: boolean;
}

export function SlotTemplatesTable({
  templates,
  canManage,
}: SlotTemplatesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteSlotTemplateAction(id);
      if (!result.error) router.refresh();
    });
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Schedule</th>
            <th className="p-4 font-medium">Duration</th>
            <th className="p-4 font-medium">Peak window</th>
            <th className="p-4 font-medium">Status</th>
            {canManage && <th className="p-4 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => {
            const peakStart =
              (template as { peak_start_time?: string }).peak_start_time?.slice(0, 5) ??
              "17:00";
            const peakEnd =
              (template as { peak_end_time?: string }).peak_end_time?.slice(0, 5) ??
              "22:00";

            return (
              <tr key={template.id} className="border-b last:border-0">
                <td className="p-4">
                  {canManage ? (
                    <Link
                      href={`/slots/templates/${template.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {template.name}
                    </Link>
                  ) : (
                    template.name
                  )}
                </td>
                <td className="p-4">
                  {template.start_time.slice(0, 5)} – {template.end_time.slice(0, 5)}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {(template.days_of_week ?? [])
                      .sort((a, b) => a - b)
                      .map((d) => DAY_LABELS_SHORT[d])
                      .join(", ") || "—"}
                  </span>
                </td>
                <td className="p-4">{template.slot_duration_minutes} min</td>
                <td className="p-4 text-muted-foreground">
                  {peakStart} – {peakEnd}
                </td>
                <td className="p-4">
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                {canManage && (
                  <td className="p-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(template.id, template.name)}
                    >
                      Delete
                    </Button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
