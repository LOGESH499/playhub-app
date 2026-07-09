"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  VenueMapPickerInnerProps,
  VenueMapPreviewInnerProps,
} from "./venue-map-inner";

export const VenueMapPicker = dynamic(
  () =>
    import("./venue-map-inner").then((mod) => mod.VenueMapPickerInner),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-md" />,
  }
) as React.ComponentType<VenueMapPickerInnerProps>;

export const VenueMapPreview = dynamic(
  () =>
    import("./venue-map-inner").then((mod) => mod.VenueMapPreviewInner),
  {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full rounded-md" />,
  }
) as React.ComponentType<VenueMapPreviewInnerProps>;
