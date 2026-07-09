import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import { ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      description="We'll email you a link to set a new password"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
