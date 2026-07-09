import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, Trophy } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import { canAccessPlatformAdmin } from "@/lib/auth/roles";
import { SignOutButton } from "@/features/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Trophy className="h-4 w-4" />
            </div>
            PLAYHUB
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-amber-600" />
            Platform Admin
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
