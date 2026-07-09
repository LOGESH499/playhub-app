"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { updateProfileAction } from "@/features/auth/actions/auth.actions";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validators/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ProfileFormProps {
  defaultValues: UpdateProfileInput & { email: string };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: defaultValues.fullName,
      phone: defaultValues.phone ?? "",
    },
  });

  function onSubmit(values: UpdateProfileInput) {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result.error) {
        setServerError(result.error);
      } else if (result.success) {
        setServerSuccess(result.success);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && <Alert variant="destructive">{serverError}</Alert>}
            {serverSuccess && <Alert variant="success">{serverSuccess}</Alert>}

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                defaultValue={defaultValues.email}
                disabled
                className="bg-muted"
              />
              <FormDescription>
                Email cannot be changed here. Contact support if needed.
              </FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
