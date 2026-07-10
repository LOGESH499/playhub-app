import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import { canAccessPlatformAdmin } from "@/lib/auth/roles";
import { SignOutButton } from "@/features/auth";
import { PlayhubLogo } from "@/components/brand/playhub-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login?redirectTo=/platform");
  }

  if (!context.isEmailVerified) {
    redirect("/verify-email");
  }

  if (!canAccessPlatformAdmin(context.appRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
          <PlayhubLogo size="sm" />
          <Badge variant="warning" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Platform Admin
          </Badge>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6">{children}</main>
    </div>
  );
}
