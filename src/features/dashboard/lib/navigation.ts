import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Dumbbell,
  FileText,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Settings,
  Shield,
  Star,
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
      label: "My Portal",
      items: [
        { title: "Portal home", href: "/portal", icon: User },
        { title: "My bookings", href: "/portal/bookings", icon: Ticket },
        { title: "Academies", href: "/portal/academies", icon: GraduationCap },
        { title: "Membership", href: "/portal/membership", icon: Users },
        { title: "Notifications", href: "/portal/notifications", icon: Bell },
        { title: "Favorites", href: "/portal/favorites", icon: Heart },
        { title: "Reviews", href: "/portal/reviews", icon: Star },
        { title: "Invoices", href: "/portal/invoices", icon: FileText },
        { title: "Settings", href: "/portal/settings", icon: Settings },
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
          title: "Slots",
          href: "/slots",
          icon: CalendarClock,
        },
        {
          title: "Bookings",
          href: "/bookings",
          icon: Ticket,
        },
        {
          title: "Academies",
          href: "/academies",
          icon: GraduationCap,
        },
        {
          title: "Payments",
          href: "/payments",
          icon: CreditCard,
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
        { title: "Profile", href: "/portal/profile", icon: User },
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
