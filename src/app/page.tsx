import Link from "next/link";
import { Trophy, MapPin, Calendar, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getUser().catch(() => null);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
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

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Book Courts. Join Academies.
            <span className="block text-primary">Play More.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
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

        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 text-center">
              <MapPin className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-3 font-semibold">Discover venues</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Find courts and facilities near you across 10+ sports.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <Calendar className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-3 font-semibold">Book in real time</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Live availability — no double bookings, no phone calls.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <GraduationCap className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-3 font-semibold">Run academies</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Batches, coaches, enrollment, and attendance — all digital.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} PLAYHUB. Built on Supabase + Vercel.
      </footer>
    </div>
  );
}
