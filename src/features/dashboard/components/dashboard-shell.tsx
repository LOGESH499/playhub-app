"use client";

import { useState } from "react";
import type { AuthContext } from "@/lib/auth/session";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { DashboardTopNav } from "@/features/dashboard/components/dashboard-top-nav";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { CommandMenu, useCommandMenu } from "@/components/layout/command-menu";
import { useSidebar } from "@/components/layout/sidebar-context";
import type { DashboardNotification } from "@/features/dashboard/lib/types";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  context: AuthContext;
  notifications: DashboardNotification[];
  unreadCount: number;
  children: React.ReactNode;
}

function ShellInner({
  context,
  notifications,
  unreadCount,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed } = useSidebar();
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandMenu();

  return (
    <>
      <div className="flex min-h-screen bg-muted/30">
        <div
          className={cn(
            "hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex transition-[width] duration-200",
            collapsed ? "lg:w-[var(--sidebar-width-collapsed)]" : "lg:w-[var(--sidebar-width)]"
          )}
        >
          <DashboardSidebar context={context} collapsed={collapsed} />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[var(--sidebar-width)] p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <DashboardSidebar
              context={context}
              onNavigate={() => setMobileOpen(false)}
              variant="mobile"
              className="w-full border-0"
            />
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-h-screen flex-1 flex-col transition-[padding] duration-200",
            collapsed ? "lg:pl-[var(--sidebar-width-collapsed)]" : "lg:pl-[var(--sidebar-width)]"
          )}
        >
          <DashboardTopNav
            context={context}
            notifications={notifications}
            unreadCount={unreadCount}
            onMenuClick={() => setMobileOpen(true)}
            onSearchClick={() => setCommandOpen(true)}
          />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      <CommandMenu
        appRole={context.appRole}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
    </>
  );
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <ShellInner {...props} />
      </SidebarProvider>
    </TooltipProvider>
  );
}
