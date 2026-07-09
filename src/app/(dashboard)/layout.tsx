import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  if (!context.isEmailVerified) {
    redirect("/verify-email");
  }

  return children;
}
