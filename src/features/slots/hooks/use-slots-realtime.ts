"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to postgres_changes on public.slots for the active tenant.
 * Triggers a soft refresh so calendar/list views stay in sync.
 */
export function useSlotsRealtime(tenantId: string | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`slots-tenant-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slots",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, router]);
}
