import { AppShell } from "@/components/layout/app-shell";
import { OperatingRoomManagement } from "@/components/operating-room/operating-room-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings & Access Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Configure hospital metadata, role permissions, and alert routing rules.</p>
            <p>Only Admin users can access this area through middleware and RLS checks.</p>
          </CardContent>
        </Card>

        <OperatingRoomManagement />
      </div>
    </AppShell>
  );
}
