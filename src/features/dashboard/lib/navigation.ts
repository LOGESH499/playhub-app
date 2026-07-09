import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Dumbbell,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Settings,
  Shield,
  Ticket,
  User,
  Users,
} from "lucide-react";
import type { AppRole } from "@/lib/auth/roles";
import { canAccessPlatformAdmin, canManageAcademy, canManageOrganization } from "@/lib/auth/roles";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

function canSeeItem(appRole: AppRole, item: NavItem, sectionLabel: string): boolean {
  if (item.href === "/platform") {
    return canAccessPlatformAdmin(appRole);
  }

  if (sectionLabel === "Management") {
    return canManageOrganization(appRole) || canManageAcademy(appRole);
  }

  return true;
}

export function getDashboardNavigation(appRole: AppRole): NavSection[] {
  const sections: NavSection[] = [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "Calendar", href: "/dashboard#calendar", icon: CalendarDays },
      ],
    },
    {
      label: "Management",
      items: [
        {
          title: "Sports",
          href: "/sports",
          icon: Dumbbell,
        },
        {
          title: "Venues",
          href: "/venues",
          icon: MapPin,
        },
        {
          title: "Courts",
          href: "/courts",
          icon: LayoutGrid,
        },
        {
          title: "Bookings",
          href: "/bookings",
          icon: Ticket,
          disabled: true,
          badge: "Soon",
        },
        {
          title: "Academies",
          href: "/academies",
          icon: GraduationCap,
          disabled: true,
          badge: "Soon",
        },
        {
          title: "Members",
          href: "/members",
          icon: Users,
          disabled: true,
          badge: "Soon",
        },
        {
          title: "Reports",
          href: "/reports",
          icon: BarChart3,
          disabled: true,
          badge: "Soon",
        },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "Organizations", href: "/organizations", icon: Building2 },
        { title: "Profile", href: "/profile", icon: User },
        { title: "Settings", href: "/profile", icon: Settings },
      ],
    },
  ];

  if (canAccessPlatformAdmin(appRole)) {
    sections.push({
      label: "Platform",
      items: [{ title: "Admin", href: "/platform", icon: Shield }],
    });
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canSeeItem(appRole, item, section.label)),
    }))
    .filter((section) => section.items.length > 0);
}
