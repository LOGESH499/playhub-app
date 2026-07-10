"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPlatformAdminAction } from "@/features/platform-admin/actions/platform-admin.actions";
import type { PlatformUser } from "@/features/platform-admin/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserTableProps {
  users: PlatformUser[];
}

export function UserTable({ users }: UserTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.fullName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                {u.isPlatformAdmin ? (
                  <Badge variant="warning">Platform admin</Badge>
                ) : (
                  <Badge variant="outline">User</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(u.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await setPlatformAdminAction({
                        userId: u.id,
                        isAdmin: !u.isPlatformAdmin,
                      });
                      router.refresh();
                    })
                  }
                >
                  {u.isPlatformAdmin ? "Revoke admin" : "Make admin"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
