import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import { ResetPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Set new password",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Set a new password"
      description="Choose a strong password for your account"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
