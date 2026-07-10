import { listPlatformUsers } from "@/features/platform-admin/lib/queries";
import { UserTable } from "@/features/platform-admin";
import { userListFiltersSchema } from "@/lib/validators/platform.schema";

export const dynamic = "force-dynamic";

export default async function PlatformUsersPage() {
  const result = await listPlatformUsers(userListFiltersSchema.parse({}));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User management</h1>
        <p className="mt-1 text-muted-foreground">
          {result.total} registered users
        </p>
      </div>
      <UserTable users={result.users} />
    </div>
  );
}
