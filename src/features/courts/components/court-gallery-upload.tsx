"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import type { CourtImageInput } from "@/lib/validators/court.schema";
import {
  removeCourtMediaAction,
  uploadCourtMediaAction,
} from "@/features/courts/actions/court.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

interface CourtGalleryUploadProps {
  courtId: string;
  images: CourtImageInput[];
  onChange: (images: CourtImageInput[]) => void;
  disabled?: boolean;
}

export function CourtGalleryUpload({
  courtId,
  images,
  onChange,
  disabled,
}: CourtGalleryUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      setError(null);
      const result = await uploadCourtMediaAction(courtId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url && result.path) {
        onChange([
          ...images,
          {
            url: result.url,
            path: result.path,
            caption: "",
            sortOrder: images.length,
            isCover: images.length === 0,
          },
        ]);
      }
    });

    e.target.value = "";
  }

  function setCover(index: number) {
    onChange(images.map((img, i) => ({ ...img, isCover: i === index })));
  }

  function updateCaption(index: number, caption: string) {
    onChange(images.map((img, i) => (i === index ? { ...img, caption } : img)));
  }

  function removeImage(index: number) {
    const image = images[index];
    if (!image) return;

    startTransition(async () => {
      setError(null);
      const result = await removeCourtMediaAction(courtId, image.path);
      if (result.error) {
        setError(result.error);
        return;
      }
      const next = images.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isCover)) {
        next[0] = { ...next[0], isCover: true };
      }
      onChange(next.map((img, i) => ({ ...img, sortOrder: i })));
    });
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((image, index) => (
          <div key={image.path} className="overflow-hidden rounded-lg border bg-card">
            <div className="relative aspect-video bg-muted">
              <Image
                src={image.url}
                alt={image.caption || `Court photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 320px"
              />
              {image.isCover && (
                <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  Cover
                </span>
              )}
            </div>
            <div className="space-y-2 p-3">
              <Input
                placeholder="Caption"
                value={image.caption ?? ""}
                onChange={(e) => updateCaption(index, e.target.value)}
                disabled={disabled || isPending}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || isPending || image.isCover}
                  onClick={() => setCover(index)}
                >
                  <Star className="h-3.5 w-3.5" />
                  Set cover
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  disabled={disabled || isPending}
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 transition-colors hover:bg-muted/50">
        {isPending ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        )}
        <span className="text-sm text-muted-foreground">
          Upload JPEG, PNG, or WebP (max 5MB)
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || isPending}
          onChange={handleUpload}
        />
      </label>
    </div>
  );
}
