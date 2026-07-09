import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import { RegisterForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Join PLAYHUB to book slots and enroll in academies"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
