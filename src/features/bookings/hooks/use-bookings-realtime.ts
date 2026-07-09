"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useBookingsRealtime(tenantId?: string, userId?: string) {
  const router = useRouter();

  useEffect(() => {
    if (!tenantId && !userId) return;

    const supabase = createClient();
    const channel = supabase.channel(
      `bookings-live-${tenantId ?? "na"}-${userId ?? "na"}`
    );

    if (tenantId) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => router.refresh()
      );

      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slots",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => router.refresh()
      );
    } else if (userId) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${userId}`,
        },
        () => router.refresh()
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, userId, router]);
}
