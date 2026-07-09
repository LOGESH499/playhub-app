"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";
import type { AuthContext } from "@/lib/auth/session";
import { getDashboardNavigation } from "@/features/dashboard/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  context: AuthContext;
  onNavigate?: () => void;
  className?: string;
}

export function DashboardSidebar({
  context,
  onNavigate,
  className,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const sections = getDashboardNavigation(context.appRole);

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r bg-card",
        className
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Trophy className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold">PLAYHUB</p>
          <p className="truncate text-xs text-muted-foreground">
            {context.activeTenant?.tenant.name ?? "Player mode"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    {item.disabled ? (
                      <span
                        className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-muted-foreground opacity-60"
                        aria-disabled
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          isActive &&
                            "bg-accent font-medium text-accent-foreground"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
