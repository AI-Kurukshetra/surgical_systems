import { AppShell } from "@/components/layout/app-shell";
import { ORDashboardLive } from "@/components/dashboard/or-dashboard-live";

export default function ORDashboardPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">OR Real-Time Board</h1>
        <ORDashboardLive />
      </div>
    </AppShell>
  );
}
