import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStatus, getStatusBadgeVariant } from "@/lib/utils";

export type ORDashboardRow = {
  room_name: string;
  surgery: string;
  surgeon: string;
  status: "available" | "in_surgery" | "cleaning" | "maintenance";
  start_time: string;
};

export function ORStatusBoard({ data }: { data: ORDashboardRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operating Room Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Name</TableHead>
                <TableHead>Surgery</TableHead>
                <TableHead>Surgeon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No data available.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.room_name}>
                    <TableCell>{row.room_name}</TableCell>
                    <TableCell>{row.surgery}</TableCell>
                    <TableCell>{row.surgeon}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(row.status)}>{formatStatus(row.status)}</Badge>
                    </TableCell>
                    <TableCell>{row.start_time}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
