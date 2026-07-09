"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { forgotPasswordAction } from "@/features/auth/actions/auth.actions";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validators/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(values);
      if (result.error) {
        setServerError(result.error);
      } else if (result.success) {
        setServerSuccess(result.success);
      }
    });
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            {serverError && <Alert variant="destructive">{serverError}</Alert>}
            {serverSuccess && <Alert variant="success">{serverSuccess}</Alert>}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </CardContent>

          <CardFooter className="justify-center border-t pt-6">
            <Link href="/login" className="text-sm text-primary hover:underline">
              Back to sign in
            </Link>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
