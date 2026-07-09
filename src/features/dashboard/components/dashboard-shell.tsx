"use client";

import { useState } from "react";
import type { AuthContext } from "@/lib/auth/session";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { DashboardTopNav } from "@/features/dashboard/components/dashboard-top-nav";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { DashboardNotification } from "@/features/dashboard/lib/types";

interface DashboardShellProps {
  context: AuthContext;
  notifications: DashboardNotification[];
  unreadCount: number;
  children: React.ReactNode;
}

export function DashboardShell({
  context,
  notifications,
  unreadCount,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-muted/20">
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
          <DashboardSidebar context={context} />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <DashboardSidebar
              context={context}
              onNavigate={() => setMobileOpen(false)}
              className="w-full border-0"
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
          <DashboardTopNav
            context={context}
            notifications={notifications}
            unreadCount={unreadCount}
            onMenuClick={() => setMobileOpen(true)}
          />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
