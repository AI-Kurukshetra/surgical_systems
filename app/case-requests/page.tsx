import { AppShell } from "@/components/layout/app-shell";
import { CaseRequestsManagement } from "@/components/surgery/case-requests-management";

export default function CaseRequestsPage() {
  return (
    <AppShell>
      <CaseRequestsManagement />
    </AppShell>
  );
}
