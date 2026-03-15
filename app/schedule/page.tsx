import { AppShell } from "@/components/layout/app-shell";
import { SurgerySchedulerCalendar } from "@/components/schedule/surgery-scheduler-calendar";
import { CalendarDays } from "lucide-react";

export default function SchedulePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <header className="border-b border-border/60 bg-gradient-to-r from-background to-muted/20 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Schedule Board</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Assign surgeries to operating rooms by dragging cases into the room columns. Drop a case on a column to move it to that room.
              </p>
            </div>
          </div>
        </header>
        <SurgerySchedulerCalendar />
      </div>
    </AppShell>
  );
}
