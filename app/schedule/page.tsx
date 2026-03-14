import { AppShell } from "@/components/layout/app-shell";
import { SurgerySchedulerCalendar } from "@/components/schedule/surgery-scheduler-calendar";

export default function SchedulePage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Schedule Board</h1>
        <SurgerySchedulerCalendar />
      </div>
    </AppShell>
  );
}
