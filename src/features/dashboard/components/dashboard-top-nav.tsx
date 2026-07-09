"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import type { AuthContext } from "@/lib/auth/session";
import { SignOutButton } from "@/features/auth";
import { RoleBadge, TenantSwitcher } from "@/features/organization";
import { NotificationsPanel } from "@/features/dashboard/components/notifications-panel";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { Input } from "@/components/ui/input";
import { getInitials } from "@/features/dashboard/lib/format";
import type { DashboardNotification } from "@/features/dashboard/lib/types";

interface DashboardTopNavProps {
  context: AuthContext;
  notifications: DashboardNotification[];
  unreadCount: number;
  onMenuClick: () => void;
}

export function DashboardTopNav({
  context,
  notifications,
  unreadCount,
  onMenuClick,
}: DashboardTopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search venues, bookings..."
          className="pl-9"
          disabled
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
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
            <Button variant="ghost" className="relative h-9 gap-2 px-2">
              <Avatar className="h-8 w-8">
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
    </header>
  );
}
