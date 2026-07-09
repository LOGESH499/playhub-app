import type { EnterpriseAnalytics } from "@/features/analytics/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AnalyticsTablesProps {
  analytics: EnterpriseAnalytics;
}

export function AnalyticsTables({ analytics }: AnalyticsTablesProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Academy performance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Programs: </span>
            {analytics.academyReports.programs}
          </p>
          <p>
            <span className="text-muted-foreground">Batches: </span>
            {analytics.academyReports.batches}
          </p>
          <p>
            <span className="text-muted-foreground">Active enrollments: </span>
            {analytics.academyReports.activeEnrollments}
          </p>
          <p>
            <span className="text-muted-foreground">Sessions: </span>
            {analytics.academyReports.sessionsInRange}
          </p>
          <p>
            <span className="text-muted-foreground">Attendance rate: </span>
            {analytics.academyReports.attendanceRate}%
          </p>
          <p>
            <span className="text-muted-foreground">Fees collected: </span>₹
            {Number(analytics.academyReports.feesCollected).toLocaleString("en-IN")}
          </p>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Coach reports</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.coachReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No coach data in range.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.coachReports.map((c) => (
                  <TableRow key={c.coach_id}>
                    <TableCell>{c.coach_name}</TableCell>
                    <TableCell>{c.sessions}</TableCell>
                    <TableCell>{c.attendance_rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
