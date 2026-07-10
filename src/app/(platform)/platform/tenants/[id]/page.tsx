import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantById } from "@/features/platform-admin/lib/queries";
import { TenantDetailPanel } from "@/features/platform-admin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface TenantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlatformTenantDetailPage({
  params,
}: TenantDetailPageProps) {
  const { id } = await params;
  const tenant = await getTenantById(id);
  if (!tenant) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/platform/tenants">← Back to tenants</Link>
      </Button>
      <TenantDetailPanel tenant={tenant} />
    </div>
  );
}
