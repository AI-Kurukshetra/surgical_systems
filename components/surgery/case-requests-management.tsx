"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { caseRequestsService } from "@/src/services/case_requests";
import { equipmentService } from "@/src/services/equipment";
import { notificationsService } from "@/src/services/notifications";
import { operatingRoomsService } from "@/src/services/operating_rooms";
import { patientsService } from "@/src/services/patients";
import { staffService } from "@/src/services/staff";
import { surgeonsService } from "@/src/services/surgeons";
import { surgeriesService } from "@/src/services/surgeries";
import { useRealtime } from "@/src/hooks/useRealtime";
import type {
  CaseRequest,
  Equipment,
  OperatingRoom,
  Patient,
  Staff,
  Surgeon,
  Surgery,
  SurgeryStatus,
} from "@/src/services/types";
import { Clock, DoorOpen, Stethoscope, User, UserCircle, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatStatus, getStatusBadgeVariant } from "@/lib/utils";

type RequestFormState = {
  patient_id: string;
  surgeon_id: string;
  procedure_name: string;
  requested_date: string;
};

type SurgeryFormState = {
  patient_id: string;
  surgeon_id: string;
  operating_room_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: SurgeryStatus;
};

const initialRequestForm: RequestFormState = {
  patient_id: "",
  surgeon_id: "",
  procedure_name: "",
  requested_date: "",
};

const statuses: SurgeryStatus[] = ["scheduled", "in_progress", "completed", "cancelled"];
const statusLabels: Record<SurgeryStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const initialSurgeryForm: SurgeryFormState = {
  patient_id: "",
  surgeon_id: "",
  operating_room_id: "",
  scheduled_start: "",
  scheduled_end: "",
  status: "scheduled",
};

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}

function formatName(first?: string | null, last?: string | null) {
  return `${first ?? ""} ${last ?? ""}`.trim() || "Unknown";
}

function SurgeryCreateModal({
  open,
  saving,
  error: surgeryError,
  patients,
  surgeons,
  rooms,
  staff,
  equipment,
  form,
  selectedStaffIds,
  selectedEquipmentIds,
  onChange,
  onStaffToggle,
  onEquipmentToggle,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  error: string | null;
  patients: Patient[];
  surgeons: Surgeon[];
  rooms: OperatingRoom[];
  staff: Staff[];
  equipment: Equipment[];
  form: SurgeryFormState;
  selectedStaffIds: string[];
  selectedEquipmentIds: string[];
  onChange: (field: keyof SurgeryFormState, value: string) => void;
  onStaffToggle: (id: string) => void;
  onEquipmentToggle: (id: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Create Surgery from Approved Request</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {surgeryError ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {surgeryError}
            </p>
          ) : null}
          {/* Schedule details */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              Schedule details
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="modal-patient" className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  Patient
                </Label>
                <Select
                  value={form.patient_id || "none"}
                  onValueChange={(value) => onChange("patient_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger id="modal-patient" className="h-10">
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
                <Label htmlFor="modal-surgeon" className="flex items-center gap-1.5 text-muted-foreground">
                  <UserCircle className="h-3.5 w-3.5" />
                  Surgeon
                </Label>
                <Select
                  value={form.surgeon_id || "none"}
                  onValueChange={(value) => onChange("surgeon_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger id="modal-surgeon" className="h-10">
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
                <Label htmlFor="modal-or" className="flex items-center gap-1.5 text-muted-foreground">
                  <DoorOpen className="h-3.5 w-3.5" />
                  Operating room
                </Label>
                <Select
                  value={form.operating_room_id || "none"}
                  onValueChange={(value) => onChange("operating_room_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger id="modal-or" className="h-10">
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
                <Label htmlFor="modal-status" className="flex items-center gap-1.5 text-muted-foreground">
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => onChange("status", value)}
                >
                  <SelectTrigger id="modal-status" className="h-10">
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
                <Label htmlFor="modal-start">Scheduled start</Label>
                <Input
                  id="modal-start"
                  type="datetime-local"
                  className="h-10"
                  value={form.scheduled_start}
                  onChange={(e) => onChange("scheduled_start", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">When the procedure is planned to begin</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-end">Scheduled end</Label>
                <Input
                  id="modal-end"
                  type="datetime-local"
                  className="h-10"
                  value={form.scheduled_end}
                  onChange={(e) => onChange("scheduled_end", e.target.value)}
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
                            selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                          onClick={() => onStaffToggle(member.id)}
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
                            selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                          onClick={() => onEquipmentToggle(item.id)}
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
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Creating..." : "Create Surgery"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CaseRequestsManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);

  const [requestForm, setRequestForm] = useState<RequestFormState>(initialRequestForm);
  const [surgeryForm, setSurgeryForm] = useState<SurgeryFormState>(initialSurgeryForm);
  const [surgerySelectedStaffIds, setSurgerySelectedStaffIds] = useState<string[]>([]);
  const [surgerySelectedEquipmentIds, setSurgerySelectedEquipmentIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingRequest, setSavingRequest] = useState(false);
  const [savingDecisionId, setSavingDecisionId] = useState<string | null>(null);
  const [savingSurgery, setSavingSurgery] = useState(false);
  const [requestFormError, setRequestFormError] = useState<string | null>(null);
  const [surgeryFormError, setSurgeryFormError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [createSurgeryForRequestId, setCreateSurgeryForRequestId] = useState<string | null>(null);

  const patientsMap = useMemo(() => {
    return new Map(patients.map((p) => [p.id, formatName(p.first_name, p.last_name)]));
  }, [patients]);

  const surgeonsMap = useMemo(() => {
    return new Map(surgeons.map((s) => [s.id, s.name ?? "Unknown"]));
  }, [surgeons]);

  const surgeryByRequestMap = useMemo(() => {
    return new Map(surgeries.filter((s) => s.case_request_id).map((s) => [s.case_request_id as string, s]));
  }, [surgeries]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setDashboardError(null);

    const [patientsRes, surgeonsRes, requestsRes, surgeriesRes, roomsRes, staffRes, equipmentRes] = await Promise.all([
      patientsService.getAll(),
      surgeonsService.getAll(),
      caseRequestsService.getAll(),
      surgeriesService.getAll(),
      operatingRoomsService.getAll(),
      staffService.getAll(),
      equipmentService.getAll(),
    ]);

    if (
      patientsRes.error ||
      surgeonsRes.error ||
      requestsRes.error ||
      surgeriesRes.error ||
      roomsRes.error ||
      staffRes.error ||
      equipmentRes.error
    ) {
      setDashboardError(
        patientsRes.error?.message ||
          surgeonsRes.error?.message ||
          requestsRes.error?.message ||
          surgeriesRes.error?.message ||
          roomsRes.error?.message ||
          staffRes.error?.message ||
          equipmentRes.error?.message ||
          "Failed to load case request data.",
      );
      setLoading(false);
      return;
    }

    setPatients(patientsRes.data ?? []);
    setSurgeons(surgeonsRes.data ?? []);
    setRequests(requestsRes.data ?? []);
    setSurgeries(surgeriesRes.data ?? []);
    setRooms(roomsRes.data ?? []);
    setStaff(staffRes.data ?? []);
    setEquipment(equipmentRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useRealtime({
    channel: "case-requests-live",
    tables: ["case_requests", "surgeries", "operating_rooms"],
    onChange: () => {
      void loadData();
    },
  });

  const onRequestChange = (field: keyof RequestFormState, value: string) => {
    setRequestForm((prev) => ({ ...prev, [field]: value }));
  };

  const onCreateRequest = async () => {
    if (!requestForm.patient_id || !requestForm.surgeon_id || !requestForm.procedure_name || !requestForm.requested_date) {
      setRequestFormError("Patient, surgeon, procedure name, and requested date are required.");
      return;
    }

    setSavingRequest(true);
    setRequestFormError(null);

    const payload = {
      patient_id: requestForm.patient_id,
      surgeon_id: requestForm.surgeon_id,
      procedure_name: requestForm.procedure_name.trim(),
      requested_date: new Date(requestForm.requested_date).toISOString(),
      status: "pending" as const,
    };

    const result = await caseRequestsService.create(payload);
    if (result.error) {
      setRequestFormError(result.error.message);
      setSavingRequest(false);
      return;
    }

    if (result.data) {
      setRequests((prev) => [result.data as CaseRequest, ...prev]);
    }

    setRequestForm(initialRequestForm);
    setSavingRequest(false);
  };

  const onDecision = async (requestId: string, status: "approved" | "rejected") => {
    setSavingDecisionId(requestId);
    setDashboardError(null);

    const result = await caseRequestsService.update(requestId, { status });
    if (result.error) {
      setDashboardError(result.error.message);
      setSavingDecisionId(null);
      return;
    }

    if (result.data) {
      const updated = result.data as CaseRequest;
      setRequests((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? {
                ...item,
                ...updated,
                patient_id: updated.patient_id ?? item.patient_id,
                surgeon_id: updated.surgeon_id ?? item.surgeon_id,
              }
            : item,
        ),
      );

      if (status === "approved") {
        const approvedRequest = result.data as CaseRequest;
        await notificationsService.create({
          user_id: null,
          message: `Case request approved: ${approvedRequest.procedure_name ?? "Procedure"} (${approvedRequest.id.slice(0, 8)})`,
          is_read: false,
        });
      }

      void loadData();
    }

    setSavingDecisionId(null);
  };

  const onCreateSurgery = async () => {
    if (!createSurgeryForRequestId) return;
    if (!surgeryForm.scheduled_start || !surgeryForm.scheduled_end) {
      setSurgeryFormError("Scheduled start and end are required to create surgery.");
      return;
    }

    const approvedRequest = requests.find((r) => r.id === createSurgeryForRequestId);
    if (!approvedRequest) {
      setSurgeryFormError("Case request not found.");
      return;
    }

    setSavingSurgery(true);
    setSurgeryFormError(null);

    const payload = {
      case_request_id: createSurgeryForRequestId,
      patient_id: (surgeryForm.patient_id || approvedRequest.patient_id) ?? null,
      surgeon_id: (surgeryForm.surgeon_id || approvedRequest.surgeon_id) ?? null,
      operating_room_id: surgeryForm.operating_room_id || null,
      scheduled_start: new Date(surgeryForm.scheduled_start).toISOString(),
      scheduled_end: new Date(surgeryForm.scheduled_end).toISOString(),
      status: surgeryForm.status,
      staff_ids: surgerySelectedStaffIds,
      equipment_ids: surgerySelectedEquipmentIds,
    };

    const result = await surgeriesService.create(payload);
    if (result.error) {
      setSurgeryFormError(result.error.message);
      setSavingSurgery(false);
      return;
    }

    if (result.data) {
      const createdSurgery = result.data as Surgery;
      setSurgeries((prev) => [...prev, createdSurgery]);
      await notificationsService.create({
        user_id: null,
        message: `Surgery scheduled for case request ${createSurgeryForRequestId.slice(0, 8)} at ${new Date(createdSurgery.scheduled_start ?? "").toLocaleString()}`,
        is_read: false,
      });
    }

    setSurgeryForm(initialSurgeryForm);
    setSurgerySelectedStaffIds([]);
    setSurgerySelectedEquipmentIds([]);
    setCreateSurgeryForRequestId(null);
    setSavingSurgery(false);
  };

  const openSurgeryModal = (requestId: string) => {
    const approvedRequest = requests.find((r) => r.id === requestId);
    setSurgeryForm({
      ...initialSurgeryForm,
      patient_id: approvedRequest?.patient_id ?? "",
      surgeon_id: approvedRequest?.surgeon_id ?? "",
    });
    setSurgerySelectedStaffIds([]);
    setSurgerySelectedEquipmentIds([]);
    setSurgeryFormError(null);
    setCreateSurgeryForRequestId(requestId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Case Request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {requestFormError ? (
            <p className="md:col-span-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {requestFormError}
            </p>
          ) : null}
          <div>
            <Label htmlFor="patient">Patient</Label>
            <Select value={requestForm.patient_id || ""} onValueChange={(value) => onRequestChange("patient_id", value)}>
              <SelectTrigger id="patient">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {formatName(patient.first_name, patient.last_name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="surgeon">Surgeon</Label>
            <Select value={requestForm.surgeon_id || ""} onValueChange={(value) => onRequestChange("surgeon_id", value)}>
              <SelectTrigger id="surgeon">
                <SelectValue placeholder="Select surgeon" />
              </SelectTrigger>
              <SelectContent>
                {surgeons.map((surgeon) => (
                  <SelectItem key={surgeon.id} value={surgeon.id}>
                    {surgeon.name ?? "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="procedure">Procedure Name</Label>
            <Input id="procedure" value={requestForm.procedure_name} onChange={(e) => onRequestChange("procedure_name", e.target.value)} placeholder="e.g. CABG" />
          </div>

          <div>
            <Label htmlFor="requested_date">Requested Date</Label>
            <Input id="requested_date" type="datetime-local" value={requestForm.requested_date} onChange={(e) => onRequestChange("requested_date", e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Button onClick={onCreateRequest} disabled={savingRequest}>
              {savingRequest ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduler Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardError ? (
            <p className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {dashboardError}
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Surgeon</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Loading case requests...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No requests submitted yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => {
                    const linkedSurgery = surgeryByRequestMap.get(req.id);
                    const isPending = req.status === "pending";
                    const isApproved = req.status === "approved";

                    return (
                      <TableRow key={req.id}>
                        <TableCell>{patientsMap.get(req.patient_id ?? "") ?? "Unknown"}</TableCell>
                        <TableCell>{surgeonsMap.get(req.surgeon_id ?? "") ?? "Unknown"}</TableCell>
                        <TableCell>{req.procedure_name ?? "-"}</TableCell>
                        <TableCell>{req.requested_date ? new Date(req.requested_date).toLocaleString() : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(req.status)}>{formatStatus(req.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!isPending || savingDecisionId === req.id}
                              onClick={() => onDecision(req.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!isPending || savingDecisionId === req.id}
                              onClick={() => onDecision(req.id, "rejected")}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              disabled={!isApproved || Boolean(linkedSurgery)}
                              onClick={() => openSurgeryModal(req.id)}
                            >
                              {linkedSurgery ? "Surgery Created" : "Create Surgery"}
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

      <SurgeryCreateModal
        open={Boolean(createSurgeryForRequestId)}
        saving={savingSurgery}
        error={surgeryFormError}
        patients={patients}
        surgeons={surgeons}
        rooms={rooms}
        staff={staff}
        equipment={equipment}
        form={surgeryForm}
        selectedStaffIds={surgerySelectedStaffIds}
        selectedEquipmentIds={surgerySelectedEquipmentIds}
        onChange={(field, value) => setSurgeryForm((prev) => ({ ...prev, [field]: value }))}
        onStaffToggle={(id) => setSurgerySelectedStaffIds((prev) => toggleId(prev, id))}
        onEquipmentToggle={(id) => setSurgerySelectedEquipmentIds((prev) => toggleId(prev, id))}
        onClose={() => {
          if (!savingSurgery) {
            setSurgeryFormError(null);
            setCreateSurgeryForRequestId(null);
          }
        }}
        onSubmit={onCreateSurgery}
      />
    </div>
  );
}
