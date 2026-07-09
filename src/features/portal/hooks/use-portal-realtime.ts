"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function usePortalRealtime(userId: string) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase.channel(`portal-live-${userId}`);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => router.refresh()
    );

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

    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, router]);
}
