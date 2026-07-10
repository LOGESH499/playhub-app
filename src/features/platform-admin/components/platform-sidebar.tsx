"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  CreditCard,
  FileText,
  Flag,
  Headphones,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/platform/tenants", label: "Tenants", icon: Building2 },
  { href: "/platform/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/platform/users", label: "Users", icon: Users },
  { href: "/platform/audit", label: "Audit logs", icon: FileText },
  { href: "/platform/feature-flags", label: "Feature flags", icon: Flag },
  { href: "/platform/settings", label: "Global settings", icon: Settings },
  { href: "/platform/support", label: "Support", icon: Headphones },
  { href: "/platform/monitoring", label: "Monitoring", icon: Activity },
];

export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <nav className="rounded-xl border border-border/70 bg-card p-2 shadow-sm">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring",
              active
                ? "bg-accent text-accent-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
