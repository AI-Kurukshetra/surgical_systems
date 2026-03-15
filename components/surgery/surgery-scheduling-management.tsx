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
import { surgeonsService } from "@/src/services/surgeons";
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
  Surgeon,
} from "@/src/services/types";
import {
  CalendarPlus,
  Clock,
  DoorOpen,
  Pencil,
  Stethoscope,
  Trash2,
  User,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatStatus, getStatusBadgeVariant } from "@/lib/utils";

type SurgeryFormState = {
  patient_id: string;
  surgeon_id: string;
  operating_room_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: SurgeryStatus;
};

const initialForm: SurgeryFormState = {
  patient_id: "",
  surgeon_id: "",
  operating_room_id: "",
  scheduled_start: "",
  scheduled_end: "",
  status: "scheduled",
};

const statuses: SurgeryStatus[] = ["scheduled", "in_progress", "completed", "cancelled"];

const statusLabels: Record<SurgeryStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}

export function SurgerySchedulingManagement() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
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

  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null);
  const [editForm, setEditForm] = useState<SurgeryFormState>(initialForm);
  const [editSelectedStaffIds, setEditSelectedStaffIds] = useState<string[]>([]);
  const [editSelectedEquipmentIds, setEditSelectedEquipmentIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [surgeryToDelete, setSurgeryToDelete] = useState<Surgery | null>(null);
  const [deleting, setDeleting] = useState(false);

  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r.room_name ?? "Unknown"])), [rooms]);
  const surgeonMap = useMemo(() => new Map(surgeons.map((s) => [s.id, s.name ?? "Unknown"])), [surgeons]);
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
      surgeonsRes,
      roomsRes,
      staffRes,
      equipmentRes,
      staffAssignmentsRes,
      equipmentAssignmentsRes,
    ] = await Promise.all([
      surgeriesService.getAll(),
      patientsService.getAll(),
      surgeonsService.getAll(),
      operatingRoomsService.getAll(),
      staffService.getAll(),
      equipmentService.getAll(),
      staffAssignmentsService.getAll(),
      equipmentAssignmentsService.getAll(),
    ]);

    if (
      surgeriesRes.error ||
      patientsRes.error ||
      surgeonsRes.error ||
      roomsRes.error ||
      staffRes.error ||
      equipmentRes.error ||
      staffAssignmentsRes.error ||
      equipmentAssignmentsRes.error
    ) {
      setError(
        surgeriesRes.error?.message ||
          patientsRes.error?.message ||
          surgeonsRes.error?.message ||
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
    setSurgeons(surgeonsRes.data ?? []);
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
      surgeon_id: form.surgeon_id || null,
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

  const openEdit = (surgery: Surgery) => {
    setEditingSurgery(surgery);
    setEditForm({
      patient_id: surgery.patient_id ?? "",
      surgeon_id: surgery.surgeon_id ?? "",
      operating_room_id: surgery.operating_room_id ?? "",
      scheduled_start: surgery.scheduled_start ? new Date(surgery.scheduled_start).toISOString().slice(0, 16) : "",
      scheduled_end: surgery.scheduled_end ? new Date(surgery.scheduled_end).toISOString().slice(0, 16) : "",
      status: (surgery.status as SurgeryStatus) ?? "scheduled",
    });
    setEditSelectedStaffIds(assignmentBySurgery.staffBySurgery[surgery.id] ?? []);
    setEditSelectedEquipmentIds(assignmentBySurgery.equipmentBySurgery[surgery.id] ?? []);
    setEditError(null);
  };

  const onSaveEdit = async () => {
    if (!editingSurgery) return;
    if (!editForm.scheduled_start || !editForm.scheduled_end) {
      setEditError("Scheduled start and end time are required.");
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    const payload = {
      patient_id: editForm.patient_id || null,
      surgeon_id: editForm.surgeon_id || null,
      operating_room_id: editForm.operating_room_id || null,
      scheduled_start: new Date(editForm.scheduled_start).toISOString(),
      scheduled_end: new Date(editForm.scheduled_end).toISOString(),
      status: editForm.status,
      staff_ids: editSelectedStaffIds,
      equipment_ids: editSelectedEquipmentIds,
    };
    const result = await surgeriesService.update(editingSurgery.id, payload);
    setSavingEdit(false);
    if (result.error || !result.data) {
      setEditError(result.error?.message ?? "Failed to update surgery.");
      return;
    }
    setEditingSurgery(null);
    await loadData();
  };

  const onConfirmDelete = async () => {
    if (!surgeryToDelete) return;
    setDeleting(true);
    const result = await surgeriesService.delete(surgeryToDelete.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error?.message ?? "Failed to delete surgery.");
      return;
    }
    setSurgeryToDelete(null);
    setError(null);
    await loadData();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b bg-muted/30 pb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Create Surgery Schedule</CardTitle>
              <CardDescription className="mt-1">
                Add a new surgery slot: assign patient, room, time window, and team resources.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {/* Schedule details */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              Schedule details
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="patient" className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  Patient
                </Label>
                <Select
                  value={form.patient_id || "none"}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, patient_id: value === "none" ? "" : value }))}
                >
                  <SelectTrigger id="patient" className="h-10">
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
              <div className="space-y-2">
                <Label htmlFor="surgeon" className="flex items-center gap-1.5 text-muted-foreground">
                  <UserCircle className="h-3.5 w-3.5" />
                  Surgeon
                </Label>
                <Select
                  value={form.surgeon_id || "none"}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, surgeon_id: value === "none" ? "" : value }))}
                >
                  <SelectTrigger id="surgeon" className="h-10">
                    <SelectValue placeholder="Select surgeon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No surgeon assigned</SelectItem>
                    {surgeons.map((surgeon) => (
                      <SelectItem key={surgeon.id} value={surgeon.id}>
                        {surgeon.name ?? "Unknown"}
                        {surgeon.specialization ? ` · ${surgeon.specialization}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="operating_room" className="flex items-center gap-1.5 text-muted-foreground">
                  <DoorOpen className="h-3.5 w-3.5" />
                  Operating room
                </Label>
                <Select
                  value={form.operating_room_id || "none"}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, operating_room_id: value === "none" ? "" : value }))}
                >
                  <SelectTrigger id="operating_room" className="h-10">
                    <SelectValue placeholder="Select room" />
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
              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-1.5 text-muted-foreground">
                  Status
                </Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as SurgeryStatus }))}>
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date & time */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Date & time
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduled_start">Scheduled start</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  className="h-10"
                  value={form.scheduled_start}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduled_start: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">When the procedure is planned to begin</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_end">Scheduled end</Label>
                <Input
                  id="scheduled_end"
                  type="datetime-local"
                  className="h-10"
                  value={form.scheduled_end}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduled_end: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">When the procedure is planned to finish</p>
              </div>
            </div>
          </div>

          {/* Team & resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Team & resources</h4>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Assign staff</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedStaffIds.length > 0 ? `${selectedStaffIds.length} selected` : "Select team members"}
                    </p>
                  </div>
                </div>
                <div className="max-h-44 space-y-1.5 overflow-auto rounded-lg border bg-background p-1.5">
                  {staff.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No staff available.</p>
                  ) : (
                    staff.map((member) => {
                      const selected = selectedStaffIds.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                          onClick={() => setSelectedStaffIds((prev) => toggleId(prev, member.id))}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-medium",
                              selected ? "border-primary-foreground/50 bg-primary-foreground/20" : "border-muted-foreground/50"
                            )}
                          >
                            {selected ? "✓" : ""}
                          </span>
                          <span className="truncate">{member.name ?? "Unknown"}</span>
                          {member.role ? (
                            <span className={cn("ml-auto shrink-0 text-xs", selected ? "opacity-90" : "text-muted-foreground")}>
                              {member.role}
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Assign equipment</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedEquipmentIds.length > 0 ? `${selectedEquipmentIds.length} selected` : "Select equipment"}
                    </p>
                  </div>
                </div>
                <div className="max-h-44 space-y-1.5 overflow-auto rounded-lg border bg-background p-1.5">
                  {equipment.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No equipment available.</p>
                  ) : (
                    equipment.map((item) => {
                      const selected = selectedEquipmentIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                          onClick={() => setSelectedEquipmentIds((prev) => toggleId(prev, item.id))}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-medium",
                              selected ? "border-primary-foreground/50 bg-primary-foreground/20" : "border-muted-foreground/50"
                            )}
                          >
                            {selected ? "✓" : ""}
                          </span>
                          <span className="truncate">{item.name ?? "Unknown"}</span>
                          {item.status ? (
                            <span className={cn("ml-auto shrink-0 text-xs", selected ? "opacity-90" : "text-muted-foreground")}>
                              {formatStatus(item.status)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 border-t pt-6">
            {error ? (
              <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button onClick={onSubmit} disabled={saving} className="w-full sm:w-auto sm:min-w-[180px]">
              {saving ? "Saving..." : "Create surgery"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>Scheduled surgeries</CardTitle>
          <CardDescription>View and update status of all scheduled procedures.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Surgeon</TableHead>
                  <TableHead>Operating room</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned staff</TableHead>
                  <TableHead>Assigned equipment</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Loading surgeries...
                    </TableCell>
                  </TableRow>
                ) : surgeries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
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
                        <TableCell>
                          {surgery.surgeon_id ? surgeonMap.get(surgery.surgeon_id) ?? "Unknown" : "-"}
                        </TableCell>
                        <TableCell>{surgery.operating_room_id ? roomMap.get(surgery.operating_room_id) ?? "Unknown" : "Unassigned"}</TableCell>
                        <TableCell>{surgery.scheduled_start ? new Date(surgery.scheduled_start).toLocaleString() : "-"}</TableCell>
                        <TableCell>{surgery.scheduled_end ? new Date(surgery.scheduled_end).toLocaleString() : "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(surgery.status)}>
                                {surgery.status ? statusLabels[surgery.status] : "-"}
                              </Badge>
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
                                    {statusLabels[status]}
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(surgery)}
                              title="Edit surgery"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setSurgeryToDelete(surgery)}
                              title="Delete surgery"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Edit surgery modal */}
      {editingSurgery ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-zinc-900 shadow-xl border-2">
            <CardHeader className="border-b bg-muted/30 shrink-0 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Edit surgery schedule</CardTitle>
                <CardDescription>Update patient, room, time, and assignments.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditingSurgery(null)}>
                Close
              </Button>
            </CardHeader>
            <CardContent className="pt-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select
                    value={editForm.patient_id || "none"}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, patient_id: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No patient</SelectItem>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {[p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Surgeon</Label>
                  <Select
                    value={editForm.surgeon_id || "none"}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, surgeon_id: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select surgeon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No surgeon assigned</SelectItem>
                      {surgeons.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name ?? "Unknown"}
                          {s.specialization ? ` · ${s.specialization}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Operating room</Label>
                  <Select
                    value={editForm.operating_room_id || "none"}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, operating_room_id: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.room_name ?? r.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, status: v as SurgeryStatus }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabels[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Scheduled start</Label>
                  <Input
                    type="datetime-local"
                    className="h-10"
                    value={editForm.scheduled_start}
                    onChange={(e) => setEditForm((p) => ({ ...p, scheduled_start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scheduled end</Label>
                  <Input
                    type="datetime-local"
                    className="h-10"
                    value={editForm.scheduled_end}
                    onChange={(e) => setEditForm((p) => ({ ...p, scheduled_end: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="mb-2 text-sm font-medium">Assign staff</p>
                  <div className="max-h-36 space-y-1.5 overflow-auto rounded-lg border bg-background p-1.5">
                    {staff.map((member) => {
                      const selected = editSelectedStaffIds.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                            selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                          onClick={() => setEditSelectedStaffIds((prev) => toggleId(prev, member.id))}
                        >
                          <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", selected ? "border-primary-foreground/50 bg-primary-foreground/20" : "border-muted-foreground/50")}>
                            {selected ? "✓" : ""}
                          </span>
                          {member.name ?? "Unknown"}
                          {member.role ? <span className="ml-auto text-xs opacity-90">{member.role}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="mb-2 text-sm font-medium">Assign equipment</p>
                  <div className="max-h-36 space-y-1.5 overflow-auto rounded-lg border bg-background p-1.5">
                    {equipment.map((item) => {
                      const selected = editSelectedEquipmentIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                            selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                          onClick={() => setEditSelectedEquipmentIds((prev) => toggleId(prev, item.id))}
                        >
                          <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", selected ? "border-primary-foreground/50 bg-primary-foreground/20" : "border-muted-foreground/50")}>
                            {selected ? "✓" : ""}
                          </span>
                          {item.name ?? "Unknown"}
                          {item.status ? <span className="ml-auto text-xs opacity-90">{formatStatus(item.status)}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {editError ? (
                <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {editError}
                </p>
              ) : null}
              <div className="flex gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setEditingSurgery(null)} disabled={savingEdit}>
                  Cancel
                </Button>
                <Button onClick={onSaveEdit} disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Delete confirmation modal */}
      {surgeryToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-zinc-900 shadow-xl border-2">
            <CardHeader className="border-b">
              <CardTitle>Delete surgery schedule</CardTitle>
              <CardDescription>
                This will permanently remove this surgery from the schedule. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  {surgeryToDelete.patient_id ? patientMap.get(surgeryToDelete.patient_id) ?? "Unknown patient" : "No patient"}
                  {" · "}
                  {surgeryToDelete.scheduled_start
                    ? new Date(surgeryToDelete.scheduled_start).toLocaleString()
                    : "No date"}
                </p>
                {surgeryToDelete.operating_room_id ? (
                  <p className="text-muted-foreground mt-1">
                    Room: {roomMap.get(surgeryToDelete.operating_room_id) ?? "Unknown"}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setSurgeryToDelete(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={onConfirmDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
