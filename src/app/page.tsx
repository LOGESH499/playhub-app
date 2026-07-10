import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, MapPin, Calendar, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/session";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default async function HomePage() {
  const user = await getUser().catch(() => null);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Trophy className="h-4 w-4" />
            </div>
            PLAYHUB
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/profile">Profile</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:py-28">
          <p className="mx-auto mb-5 w-fit rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            Production-ready sports operations SaaS
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
            Book Courts. Join Academies.
            <span className="block text-primary">Play More.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Real-time slot booking for football, cricket, badminton, tennis,
            swimming, and more — plus academy management in one platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href={user ? "/dashboard" : "/register"}>
                {user ? "Go to dashboard" : "Create free account"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border/70 bg-surface py-16">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
            <div className="surface-card p-6 text-center">
              <MapPin className="mx-auto h-5 w-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">Discover venues</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Find courts and facilities near you across 10+ sports.
              </p>
            </div>
            <div className="surface-card p-6 text-center">
              <Calendar className="mx-auto h-5 w-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">Book in real time</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Live availability — no double bookings, no phone calls.
              </p>
            </div>
            <div className="surface-card p-6 text-center">
              <GraduationCap className="mx-auto h-5 w-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">Run academies</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Batches, coaches, enrollment, and attendance — all digital.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} PLAYHUB. Built on Supabase + Vercel.
      </footer>
    </div>
  );
}
