import type { AuditLogRow } from "@/features/platform-admin/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLogTableProps {
  logs: AuditLogRow[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No audit logs.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Actor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-sm">{log.action}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {log.entityType} · {log.entityId.slice(0, 8)}
              </TableCell>
              <TableCell className="text-sm">{log.actorName ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
