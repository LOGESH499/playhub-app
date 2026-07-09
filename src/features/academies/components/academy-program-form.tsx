"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createProgramAction,
  updateProgramAction,
} from "@/features/academies/actions/academy.actions";
import { slugifyAcademyName } from "@/features/academies/lib/parse";
import type { ProgramWithRelations } from "@/features/academies/lib/types";
import { ACADEMY_TYPES, ACADEMY_LABELS } from "@/lib/database/enums";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AcademyProgramFormProps {
  program?: ProgramWithRelations;
  venues: Array<{ id: string; name: string }>;
  mode: "create" | "edit";
}

export function AcademyProgramForm({
  program,
  venues,
  mode,
}: AcademyProgramFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(program?.name ?? "");
  const [slug, setSlug] = useState(program?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(program?.slug));

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugifyAcademyName(value));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);

    const payload = {
      venueId: String(fd.get("venueId")),
      name,
      slug,
      academyType: String(fd.get("academyType")) as (typeof ACADEMY_TYPES)[number],
      description: String(fd.get("description") ?? ""),
      isPublished: fd.get("isPublished") === "on",
      images: [],
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createProgramAction(payload);
        if (result?.error) setError(result.error);
      } else if (program) {
        const result = await updateProgramAction({ ...payload, id: program.id });
        if (result.error) setError(result.error);
        if (result.success) {
          setSuccess(result.success);
          router.refresh();
        }
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="surface-card max-w-2xl space-y-4 p-6">
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="space-y-2">
        <label className="text-sm font-medium">Venue</label>
        <select
          name="venueId"
          required
          defaultValue={program?.venue_id ?? ""}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="" disabled>
            Select venue
          </option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Program name</label>
        <Input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Slug</label>
        <Input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Academy type</label>
        <select
          name="academyType"
          defaultValue={program?.academy_type ?? ACADEMY_TYPES[0]}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {ACADEMY_TYPES.map((type) => (
            <option key={type} value={type}>
              {ACADEMY_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          defaultValue={program?.description ?? ""}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={program?.is_published ?? false}
        />
        Publish program (visible to students)
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "create" ? "Create program" : "Save changes"}
      </Button>
    </form>
  );
}
