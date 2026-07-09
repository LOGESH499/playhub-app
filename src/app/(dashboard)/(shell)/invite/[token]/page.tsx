import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import { InviteAcceptForm } from "@/features/organization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const context = await getAuthContext();

  if (!context) {
    redirect(`/login?redirectTo=/invite/${token}`);
  }

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="mt-2">Organization invitation</CardTitle>
          <p className="text-sm text-muted-foreground">
            Accept the invitation sent to <strong>{context.email}</strong> to
            join the organization.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <InviteAcceptForm token={token} />
          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard">Decline and go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
