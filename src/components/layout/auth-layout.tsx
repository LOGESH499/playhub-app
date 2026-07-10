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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="relative mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Trophy className="h-5 w-5" />
        </div>
        <Link href="/" className="text-2xl font-semibold tracking-[-0.03em]">
          PLAYHUB
        </Link>
      </div>

      <div className="relative w-full max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-balance">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground text-balance">{description}</p>
      </div>

      <Card className="relative mt-8 w-full max-w-md surface-card">
        <CardContent className="p-6">
          <SupabaseConfigNotice />
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
