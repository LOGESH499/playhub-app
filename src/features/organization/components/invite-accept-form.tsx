"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { acceptInviteAction } from "@/features/organization/actions/organization.actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

interface InviteAcceptFormProps {
  token: string;
}

export function InviteAcceptForm({ token }: InviteAcceptFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    setServerError(null);
    startTransition(async () => {
      const result = await acceptInviteAction({ token });
      if (result?.error) {
        setServerError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      <Button onClick={handleAccept} className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Accepting invite...
          </>
        ) : (
          "Accept invitation"
        )}
      </Button>
    </div>
  );
}
