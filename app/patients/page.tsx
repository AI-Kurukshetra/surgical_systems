import { AppShell } from "@/components/layout/app-shell";
import { PatientManagement } from "@/components/patient/patient-management";

export default function PatientsPage() {
  return (
    <AppShell>
      <PatientManagement />
    </AppShell>
  );
}
