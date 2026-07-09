"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useAttendanceRealtime(tenantId?: string) {
  const router = useRouter();

  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();
    const channel = supabase.channel(`attendance-live-${tenantId}`);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "attendance_records",
        filter: `tenant_id=eq.${tenantId}`,
      },
      () => router.refresh()
    );

    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, router]);
}
