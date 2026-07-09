import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { ResendVerificationForm } from "@/features/auth/components/resend-verification-form";
import { getUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Verify your email",
};

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage() {
  const user = await getUser();

  if (user?.email_confirmed_at) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout
      title="Check your inbox"
      description="We sent a verification link to your email address"
    >
      <Card>
        <CardContent className="space-y-4 pt-6 text-center">
          <Mail className="mx-auto h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">
            Click the link in your email to verify your account. Once verified,
            you can sign in and complete setup.
          </p>
          {user && <ResendVerificationForm />}
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
