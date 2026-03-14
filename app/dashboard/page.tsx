import { AppShell } from "@/components/layout/app-shell";
import { LiveCommandDashboard } from "@/components/dashboard/live-command-dashboard";
import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { user, role } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const showRoleWarning = role === null;

  return (
    <AppShell>
      <div className="space-y-4">
        {showRoleWarning ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Role assignment pending. You can view the dashboard, but other modules are restricted until an admin assigns your role.
          </div>
        ) : null}
        <LiveCommandDashboard />
      </div>
    </AppShell>
  );
}
