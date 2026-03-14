import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { UserManagement } from "@/components/admin/user-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/src/lib/auth";

export default async function AdminUsersPage() {
  const { user, role } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Admin Users</h1>
        {role === "admin" ? (
          <UserManagement />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">You don't have permission to view this resource.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
