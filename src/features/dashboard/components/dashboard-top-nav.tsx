"use client";

import Link from "next/link";
import { Menu, Plus, Search } from "lucide-react";
import type { AuthContext } from "@/lib/auth/session";
import { SignOutButton } from "@/features/auth";
import { RoleBadge, TenantSwitcher } from "@/features/organization";
import { NotificationsPanel } from "@/features/dashboard/components/notifications-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/features/dashboard/lib/format";
import type { DashboardNotification } from "@/features/dashboard/lib/types";

interface DashboardTopNavProps {
  context: AuthContext;
  notifications: DashboardNotification[];
  unreadCount: number;
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function DashboardTopNav({
  context,
  notifications,
  unreadCount,
  onMenuClick,
  onSearchClick,
}: DashboardTopNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden min-w-0 flex-1 md:block">
          <AppBreadcrumbs />
        </div>

        <button
          type="button"
          onClick={onSearchClick}
          className="relative hidden h-10 w-full max-w-md items-center gap-2 rounded-xl border border-input bg-background/70 px-3 text-sm text-muted-foreground shadow-xs transition-[background-color,border-color,box-shadow] hover:border-border hover:bg-muted/40 hover:shadow-sm md:flex"
          aria-label="Open command menu"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search...</span>
          <kbd className="pointer-events-none ml-auto hidden rounded-md border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden gap-1.5 sm:inline-flex"
            onClick={onSearchClick}
          >
            <Plus className="h-4 w-4" />
            Quick
          </Button>

          <div className="hidden sm:block">
            <TenantSwitcher
              memberships={context.memberships}
              activeTenantId={context.activeTenant?.tenantId ?? null}
            />
          </div>

          <NotificationsPanel
            notifications={notifications}
            unreadCount={unreadCount}
          />

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 gap-2 rounded-xl px-2">
                <Avatar className="h-8 w-8 ring-1 ring-border">
                  <AvatarImage
                    src={context.profile.avatar_url ?? undefined}
                    alt={context.profile.full_name}
                  />
                  <AvatarFallback>
                    {getInitials(context.profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">
                  {context.profile.full_name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{context.profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{context.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <RoleBadge role={context.appRole} />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/organizations">Organizations</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="p-1">
                <SignOutButton />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
