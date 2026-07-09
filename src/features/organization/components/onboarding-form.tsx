"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { createOrganizationAction } from "@/features/organization/actions/organization.actions";
import { joinAsCustomerAction } from "@/features/organization/actions/organization.actions";
import {
  createOrganizationSchema,
  slugifyOrganizationName,
  type CreateOrganizationInput,
} from "@/lib/validators/organization.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
];

export function OnboardingForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      timezone: "Asia/Kolkata",
      contactEmail: "",
      contactPhone: "",
    },
  });

  const watchName = useWatch({ control: form.control, name: "name" });

  useEffect(() => {
    if (!slugTouched && watchName) {
      form.setValue("slug", slugifyOrganizationName(watchName), {
        shouldValidate: true,
      });
    }
  }, [watchName, slugTouched, form]);

  function onSubmit(values: CreateOrganizationInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createOrganizationAction(values);
      if (result?.error) {
        setServerError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleJoinAsCustomer() {
    setServerError(null);
    startTransition(async () => {
      const result = await joinAsCustomerAction();
      if (result?.error) {
        setServerError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Mumbai Sports Arena"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL slug</FormLabel>
                <FormControl>
                  <Input
                    placeholder="mumbai-sports-arena"
                    disabled={isPending}
                    {...field}
                    onChange={(e) => {
                      setSlugTouched(true);
                      field.onChange(e);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Used in links and subdomains. Lowercase letters, numbers, and
                  hyphens only.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    disabled={isPending}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact email (optional)</FormLabel>
                <FormControl>
                  <Input type="email" disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact phone (optional)</FormLabel>
                <FormControl>
                  <Input type="tel" disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Creating organization...
              </>
            ) : (
              "Create organization"
            )}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={handleJoinAsCustomer}
      >
        Continue as a player (no organization)
      </Button>
    </div>
  );
}
