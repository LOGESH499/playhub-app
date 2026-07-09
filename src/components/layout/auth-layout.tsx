import Link from "next/link";
import { Trophy } from "lucide-react";
import { SupabaseConfigNotice } from "@/components/supabase-config-notice";
import { Card, CardContent } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_50%)] opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,var(--background))]"
      />

      <div className="relative mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <Trophy className="h-5 w-5" />
        </div>
        <Link href="/" className="text-2xl font-semibold tracking-tight">
          PLAYHUB
        </Link>
      </div>

      <div className="relative w-full max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="text-sm text-muted-foreground text-balance">{description}</p>
      </div>

      <Card className="relative mt-8 w-full max-w-md surface-card shadow-lg">
        <CardContent className="p-6">
          <SupabaseConfigNotice />
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
