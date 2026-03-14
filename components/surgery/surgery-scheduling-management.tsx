"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRealtime } from "@/src/hooks/useRealtime";
import { equipmentService } from "@/src/services/equipment";
import { equipmentAssignmentsService } from "@/src/services/equipment_assignments";
import { notificationsService } from "@/src/services/notifications";
import { operatingRoomsService } from "@/src/services/operating_rooms";
import { patientsService } from "@/src/services/patients";
import { staffService } from "@/src/services/staff";
import { staffAssignmentsService } from "@/src/services/staff_assignments";
import { surgeriesService } from "@/src/services/surgeries";
import type {
  Equipment,
  EquipmentAssignment,
  OperatingRoom,
  Patient,
  Staff,
  StaffAssignment,
  Surgery,
  SurgeryStatus,
} from "@/src/services/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SurgeryFormState = {
  patient_id: string;
  operating_room_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: SurgeryStatus;
};

const initialForm: SurgeryFormState = {
  patient_id: "",
  operating_room_id: "",
  scheduled_start: "",
  scheduled_end: "",
  status: "scheduled",
};

const statuses: SurgeryStatus[] = ["scheduled", "in_progress", "completed", "cancelled"];

function statusBadge(status: SurgeryStatus | null) {
  if (status === "completed") return "secondary" as const;
  if (status === "cancelled") return "destructive" as const;
  return "default" as const;
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}

export function SurgerySchedulingManagement() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [equipmentAssignments, setEquipmentAssignments] = useState<EquipmentAssignment[]>([]);

  const [form, setForm] = useState<SurgeryFormState>(initialForm);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r.room_name ?? "Unknown"])), [rooms]);
  const patientMap = useMemo(
    () =>
      new Map(
        patients.map((p) => [
          p.id,
          [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Unknown",
        ])
      ),
    [patients]
  );
  const staffMap = useMemo(() => new Map(staff.map((s) => [s.id, s.name ?? "Unknown"])), [staff]);
  const equipmentMap = useMemo(() => new Map(equipment.map((e) => [e.id, e.name ?? "Unknown"])), [equipment]);

  const assignmentBySurgery = useMemo(() => {
    const staffBySurgery = staffAssignments.reduce<Record<string, string[]>>((acc, row) => {
      if (!row.surgery_id || !row.staff_id) return acc;
      if (!acc[row.surgery_id]) acc[row.surgery_id] = [];
      acc[row.surgery_id].push(row.staff_id);
      return acc;
    }, {});

    const equipmentBySurgery = equipmentAssignments.reduce<Record<string, string[]>>((acc, row) => {
      if (!row.surgery_id || !row.equipment_id) return acc;
      if (!acc[row.surgery_id]) acc[row.surgery_id] = [];
      acc[row.surgery_id].push(row.equipment_id);
      return acc;
    }, {});

    return { staffBySurgery, equipmentBySurgery };
  }, [staffAssignments, equipmentAssignments]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [
      surgeriesRes,
      patientsRes,
      roomsRes,
      staffRes,
      equipmentRes,
      staffAssignmentsRes,
      equipmentAssignmentsRes,
    ] = await Promise.all([
      surgeriesService.getAll(),
      patientsService.getAll(),
      operatingRoomsService.getAll(),
      staffService.getAll(),
      equipmentService.getAll(),
      staffAssignmentsService.getAll(),
      equipmentAssignmentsService.getAll(),
    ]);

    if (
      surgeriesRes.error ||
      patientsRes.error ||
      roomsRes.error ||
      staffRes.error ||
      equipmentRes.error ||
      staffAssignmentsRes.error ||
      equipmentAssignmentsRes.error
    ) {
      setError(
        surgeriesRes.error?.message ||
          patientsRes.error?.message ||
          roomsRes.error?.message ||
          staffRes.error?.message ||
          equipmentRes.error?.message ||
          staffAssignmentsRes.error?.message ||
          equipmentAssignmentsRes.error?.message ||
          "Failed to load scheduling data.",
      );
      setLoading(false);
      return;
    }

    setSurgeries(surgeriesRes.data ?? []);
    setPatients(patientsRes.data ?? []);
    setRooms(roomsRes.data ?? []);
    setStaff(staffRes.data ?? []);
    setEquipment(equipmentRes.data ?? []);
    setStaffAssignments(staffAssignmentsRes.data ?? []);
    setEquipmentAssignments(equipmentAssignmentsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useRealtime({
    channel: "surgery-scheduler-live",
    tables: ["surgeries", "operating_rooms", "case_requests"],
    onChange: () => {
      void loadData();
    },
  });

  const onSubmit = async () => {
    if (!form.scheduled_start || !form.scheduled_end) {
      setError("Scheduled start and end time are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const createPayload = {
      case_request_id: null,
      patient_id: form.patient_id || null,
      operating_room_id: form.operating_room_id || null,
      scheduled_start: new Date(form.scheduled_start).toISOString(),
      scheduled_end: new Date(form.scheduled_end).toISOString(),
      status: form.status,
      staff_ids: selectedStaffIds,
      equipment_ids: selectedEquipmentIds,
    };

    const createResult = await surgeriesService.create(createPayload);

    if (createResult.error || !createResult.data) {
      setError(createResult.error?.message ?? "Failed to create surgery.");
      setSaving(false);
      return;
    }

    const createdSurgery = createResult.data as Surgery;

    setForm(initialForm);
    setSelectedStaffIds([]);
    setSelectedEquipmentIds([]);
    setError(null);
    setSaving(false);

    await loadData();

    await notificationsService.create({
      user_id: null,
      message: `Surgery scheduled for ${createdSurgery.scheduled_start ? new Date(createdSurgery.scheduled_start).toLocaleString() : "upcoming slot"}`,
      is_read: false,
    });
  };

  const onStatusChange = async (surgeryId: string, status: SurgeryStatus) => {
    const currentSurgery = surgeries.find((item) => item.id === surgeryId) ?? null;

    const result = await surgeriesService.update(surgeryId, { status });
    if (result.error || !result.data) {
      setError(result.error?.message ?? "Failed to update surgery status.");
      return;
    }

    const updatedSurgery = result.data as Surgery;
    setSurgeries((prev) => prev.map((item) => (item.id === surgeryId ? updatedSurgery : item)));

    const scheduledStart = currentSurgery?.scheduled_start ? new Date(currentSurgery.scheduled_start).getTime() : null;
    const now = Date.now();
    const delayedStart = status === "in_progress" && scheduledStart !== null && now > scheduledStart;

    if (delayedStart) {
      await notificationsService.create({
        user_id: null,
        message: `Surgery delay alert: case ${surgeryId.slice(0, 8)} started later than scheduled.`,
        is_read: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Surgery Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="patient">Patient</Label>
              <Select
                value={form.patient_id || "none"}
                onValueChange={(value) => setForm((prev) => ({ ...prev, patient_id: value === "none" ? "" : value }))}
              >
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No patient</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {[patient.first_name, patient.last_name].filter(Boolean).join(" ").trim() || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="operating_room">Operating Room</Label>
              <Select
                value={form.operating_room_id || "none"}
                onValueChange={(value) => setForm((prev) => ({ ...prev, operating_room_id: value === "none" ? "" : value }))}
              >
                <SelectTrigger id="operating_room">
                  <SelectValue placeholder="Select operating room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.room_name ?? room.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as SurgeryStatus }))}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduled_start">Start Time</Label>
              <Input
                id="scheduled_start"
                type="datetime-local"
                value={form.scheduled_start}
                onChange={(e) => setForm((prev) => ({ ...prev, scheduled_start: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="scheduled_end">End Time</Label>
              <Input
                id="scheduled_end"
                type="datetime-local"
                value={form.scheduled_end}
                onChange={(e) => setForm((prev) => ({ ...prev, scheduled_end: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">Assign Staff</p>
              <div className="max-h-44 space-y-2 overflow-auto">
                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff available.</p>
                ) : (
                  staff.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                        selectedStaffIds.includes(member.id) ? "border-primary bg-primary/10" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedStaffIds((prev) => toggleId(prev, member.id))}
                    >
                      {member.name ?? "Unknown"} {member.role ? `(${member.role})` : ""}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">Assign Equipment</p>
              <div className="max-h-44 space-y-2 overflow-auto">
                {equipment.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No equipment available.</p>
                ) : (
                  equipment.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                        selectedEquipmentIds.includes(item.id) ? "border-primary bg-primary/10" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedEquipmentIds((prev) => toggleId(prev, item.id))}
                    >
                      {item.name ?? "Unknown"} {item.status ? `(${item.status})` : ""}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Create Surgery"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Surgeries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Operating Room</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Staff</TableHead>
                  <TableHead>Assigned Equipment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Loading surgeries...
                    </TableCell>
                  </TableRow>
                ) : surgeries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No surgeries scheduled yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  surgeries.map((surgery) => {
                    const staffIds = assignmentBySurgery.staffBySurgery[surgery.id] ?? [];
                    const equipmentIds = assignmentBySurgery.equipmentBySurgery[surgery.id] ?? [];

                    return (
                      <TableRow key={surgery.id}>
                        <TableCell>{surgery.patient_id ? patientMap.get(surgery.patient_id) ?? "Unknown" : "-"}</TableCell>
                        <TableCell>{surgery.operating_room_id ? roomMap.get(surgery.operating_room_id) ?? "Unknown" : "Unassigned"}</TableCell>
                        <TableCell>{surgery.scheduled_start ? new Date(surgery.scheduled_start).toLocaleString() : "-"}</TableCell>
                        <TableCell>{surgery.scheduled_end ? new Date(surgery.scheduled_end).toLocaleString() : "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusBadge(surgery.status)}>{surgery.status ?? "-"}</Badge>
                            <Select
                              value={surgery.status ?? "scheduled"}
                              onValueChange={(value) => void onStatusChange(surgery.id, value as SurgeryStatus)}
                            >
                              <SelectTrigger className="h-8 w-36">
                                <SelectValue placeholder="Update status" />
                              </SelectTrigger>
                              <SelectContent>
                                {statuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          {staffIds.length === 0
                            ? "-"
                            : staffIds
                                .map((id) => staffMap.get(id) ?? "Unknown")
                                .slice(0, 3)
                                .join(", ")}
                        </TableCell>
                        <TableCell>
                          {equipmentIds.length === 0
                            ? "-"
                            : equipmentIds
                                .map((id) => equipmentMap.get(id) ?? "Unknown")
                                .slice(0, 3)
                                .join(", ")}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
