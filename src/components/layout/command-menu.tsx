"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/lib/auth/roles";
import { getDashboardNavigation } from "@/features/dashboard/lib/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandMenuProps {
  appRole: AppRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ appRole, open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const sections = getDashboardNavigation(appRole);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages and actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {sections.map((section, index) => (
          <div key={section.label}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={section.label}>
              {section.items
                .filter((item) => !item.disabled)
                .map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`${item.title} ${section.label}`}
                    onSelect={() => {
                      onOpenChange(false);
                      router.push(item.href);
                    }}
                  >
                    <item.icon className="text-muted-foreground" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </div>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              router.push("/profile");
            }}
          >
            <span>Profile settings</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              router.push("/organizations");
            }}
          >
            <span>Organizations</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        <CommandShortcut className="mr-1">⌘</CommandShortcut>
        <CommandShortcut>K</CommandShortcut>
        <span className="ml-2">to open</span>
      </div>
    </CommandDialog>
  );
}

export function useCommandMenu() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
