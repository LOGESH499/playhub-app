import Link from "next/link";
import {
  Bell,
  Calendar,
  FileText,
  GraduationCap,
  Heart,
  Star,
  Ticket,
  Users,
} from "lucide-react";
import type { PortalDashboardData } from "@/features/portal/lib/types";
import { Button } from "@/components/ui/button";

interface PortalStatsCardsProps {
  data: PortalDashboardData;
}

export function PortalStatsCards({ data }: PortalStatsCardsProps) {
  const items = [
    {
      label: "Upcoming bookings",
      value: data.upcomingBookings.length,
      href: "/portal/bookings",
      icon: Calendar,
    },
    {
      label: "Unread notifications",
      value: data.unreadCount,
      href: "/portal/notifications",
      icon: Bell,
    },
    {
      label: "Academy enrollments",
      value: data.enrollments.length,
      href: "/portal/academies",
      icon: GraduationCap,
    },
    {
      label: "Active memberships",
      value: data.memberships.length,
      href: "/portal/membership",
      icon: Users,
    },
    {
      label: "Favorite venues",
      value: data.favoriteVenueCount,
      href: "/portal/favorites",
      icon: Heart,
    },
    {
      label: "My reviews",
      value: data.reviewCount,
      href: "/portal/reviews",
      icon: Star,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="surface-card-hover flex items-center gap-4 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <item.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

interface PortalQuickActionsProps {
  hasUpcoming: boolean;
}

export function PortalQuickActions({ hasUpcoming }: PortalQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/bookings/new">
          <Ticket className="h-4 w-4" />
          Book a slot
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/portal/invoices">
          <FileText className="h-4 w-4" />
          Invoices
        </Link>
      </Button>
      {!hasUpcoming && (
        <Button asChild size="sm">
          <Link href="/bookings/new">Find availability</Link>
        </Button>
      )}
    </div>
  );
}
