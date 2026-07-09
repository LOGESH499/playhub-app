"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import type { AuthContext } from "@/lib/auth/session";
import { getDashboardNavigation } from "@/features/dashboard/lib/navigation";
import { useSidebar } from "@/components/layout/sidebar-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  context: AuthContext;
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
  variant?: "desktop" | "mobile";
}

export function DashboardSidebar({
  context,
  onNavigate,
  className,
  collapsed = false,
  variant = "desktop",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { toggleCollapsed } = useSidebar();
  const sections = getDashboardNavigation(context.appRole);
  const isCollapsed = variant === "mobile" ? false : collapsed;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        isCollapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
        className
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          isCollapsed ? "justify-center px-2" : "gap-3 px-4"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Trophy className="h-4 w-4" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">PLAYHUB</p>
            <p className="truncate text-xs text-muted-foreground">
              {context.activeTenant?.tenant.name ?? "Player mode"}
            </p>
          </div>
        )}
        {!isCollapsed && variant === "desktop" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 shrink-0 lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isCollapsed && variant === "desktop" && (
        <div className="hidden border-b border-sidebar-border p-2 lg:block">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 w-full"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                const linkContent = (
                  <>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                    {!isCollapsed && item.badge && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                );

                const linkClass = cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors focus-ring",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  item.disabled && "pointer-events-none opacity-50"
                );

                const node = item.disabled ? (
                  <span className={linkClass} aria-disabled>
                    {linkContent}
                  </span>
                ) : (
                  <Link href={item.href} onClick={onNavigate} className={linkClass}>
                    {linkContent}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {isCollapsed && !item.disabled ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{node}</TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    ) : (
                      node
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
