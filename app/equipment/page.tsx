import { AppShell } from "@/components/layout/app-shell";
import { EquipmentManagement } from "@/components/equipment/equipment-management";

export default function EquipmentPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Equipment Tracking</h1>
        <EquipmentManagement />
      </div>
    </AppShell>
  );
}
