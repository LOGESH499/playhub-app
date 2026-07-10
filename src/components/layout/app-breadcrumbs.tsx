"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  sports: "Sports",
  venues: "Venues",
  courts: "Courts",
  slots: "Slots",
  bookings: "Bookings",
  academies: "Academies",
  portal: "Portal",
  membership: "Membership",
  favorites: "Favorites",
  broadcasts: "Broadcasts",
  preferences: "Preferences",
  payments: "Payments",
  invoices: "Invoices",
  settings: "Settings",
  batches: "Batches",
  sessions: "Sessions",
  templates: "Templates",
  profile: "Profile",
  organizations: "Organizations",
  platform: "Platform",
  new: "New",
  edit: "Edit",
};

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    const label =
      ROUTE_LABELS[segment] ??
      (segment.match(/^[0-9a-f-]{36}$/i) ? "Details" : segment);

    return { href, label, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="contents">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
