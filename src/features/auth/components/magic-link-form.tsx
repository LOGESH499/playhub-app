"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Mail } from "lucide-react";
import { signInWithMagicLinkAction } from "@/features/auth/actions/auth.actions";
import {
  magicLinkSchema,
  type MagicLinkInput,
} from "@/lib/validators/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function MagicLinkForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: MagicLinkInput) {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      const result = await signInWithMagicLinkAction(values);
      if (result.error) {
        setServerError(result.error);
      } else if (result.success) {
        setServerSuccess(result.success);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Mail className="h-4 w-4" />
          Sign in with magic link
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && <Alert variant="destructive">{serverError}</Alert>}
            {serverSuccess && <Alert variant="success">{serverSuccess}</Alert>}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending link...
                </>
              ) : (
                "Email me a sign-in link"
              )}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
