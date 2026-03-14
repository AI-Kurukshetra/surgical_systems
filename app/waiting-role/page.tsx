import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WaitingRolePage() {
  return (
    <AppShell>
      <Card>
        <CardHeader>
          <CardTitle>Role Assignment Pending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Your account is authenticated, but no role has been assigned yet.</p>
          <p>Please ask an administrator to assign one of these roles: admin, scheduler, surgeon, or staff.</p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
