import Link from "next/link";
import { PlayhubLogoMark } from "@/components/brand/playhub-logo";
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
        <PlayhubLogoMark size="lg" />
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
