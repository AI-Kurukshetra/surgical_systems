import { AppShell } from "@/components/layout/app-shell";
import { EquipmentSelector } from "@/components/equipment/equipment-selector";
import { StaffAssignmentPanel } from "@/components/staff/staff-assignment-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewSurgeryPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Schedule New Surgery</h1>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Procedure Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="procedure">Procedure</Label>
                <Input id="procedure" placeholder="e.g. CABG" />
              </div>
              <div>
                <Label htmlFor="patient">Patient MRN / Name</Label>
                <Input id="patient" placeholder="MRN-3021" />
              </div>
              <div>
                <Label htmlFor="start">Scheduled Start</Label>
                <Input id="start" type="datetime-local" />
              </div>
              <div>
                <Label htmlFor="end">Scheduled End</Label>
                <Input id="end" type="datetime-local" />
              </div>
              <Button>Save Surgery</Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <StaffAssignmentPanel />
            <EquipmentSelector />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
