import { AppShell } from "@/components/layout/app-shell";
import { SurgerySchedulingManagement } from "@/components/surgery/surgery-scheduling-management";

export default function SurgeriesPage() {
  return (
    <AppShell>
      <SurgerySchedulingManagement />
    </AppShell>
  );
}
