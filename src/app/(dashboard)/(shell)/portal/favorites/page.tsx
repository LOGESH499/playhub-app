import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { PortalFavoritesPanel, PortalLiveShell } from "@/features/portal";
import {
  listFavoriteSports,
  listFavoriteVenues,
} from "@/features/portal/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Favorites" };
export const dynamic = "force-dynamic";

export default async function PortalFavoritesPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/favorites");

  const [venues, sports] = await Promise.all([
    listFavoriteVenues(),
    listFavoriteSports(),
  ]);

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="Favorites"
          description="Venues and sports you have saved"
        />
        <PortalFavoritesPanel venues={venues} sports={sports} />
      </div>
    </PortalLiveShell>
  );
}
