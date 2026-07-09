import Link from "next/link";
import { Trophy } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Trophy className="h-5 w-5" />
        </div>
        <Link href="/" className="text-2xl font-bold tracking-tight">
          PLAYHUB
        </Link>
      </div>

      <div className="w-full max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-6 w-full max-w-md">{children}</div>
    </div>
  );
}
