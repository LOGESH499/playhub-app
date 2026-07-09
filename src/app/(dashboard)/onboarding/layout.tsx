import Link from "next/link";
import { Trophy } from "lucide-react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-background px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Trophy className="h-4 w-4" />
          </div>
          PLAYHUB
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
