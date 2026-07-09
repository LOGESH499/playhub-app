"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { resendVerificationEmailAction } from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function ResendVerificationForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      const result = await resendVerificationEmailAction();
      if (result.error) {
        setServerError(result.error);
      } else if (result.success) {
        setServerSuccess(result.success);
      }
    });
  }

  return (
    <div className="space-y-3">
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {serverSuccess && <Alert variant="success">{serverSuccess}</Alert>}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={handleResend}
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Sending...
          </>
        ) : (
          "Resend verification email"
        )}
      </Button>
    </div>
  );
}
