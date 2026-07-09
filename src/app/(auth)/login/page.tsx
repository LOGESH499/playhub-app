import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginForm, MagicLinkForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to manage bookings and academies"
    >
      <div className="space-y-4">
        <LoginForm redirectTo={params.redirectTo} error={params.error} />
        <MagicLinkForm />
      </div>
    </AuthLayout>
  );
}
