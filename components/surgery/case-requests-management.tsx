"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { caseRequestsService } from "@/src/services/case_requests";
import { notificationsService } from "@/src/services/notifications";
import { patientsService } from "@/src/services/patients";
import { surgeonsService } from "@/src/services/surgeons";
import { surgeriesService } from "@/src/services/surgeries";
import { operatingRoomsService } from "@/src/services/operating_rooms";
import { useRealtime } from "@/src/hooks/useRealtime";
import type { CaseRequest, CaseRequestStatus, OperatingRoom, Patient, Surgeon, Surgery } from "@/src/services/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RequestFormState = {
  patient_id: string;
  surgeon_id: string;
  procedure_name: string;
  requested_date: string;
};

type SurgeryFormState = {
  operating_room_id: string;
  scheduled_start: string;
  scheduled_end: string;
};

const initialRequestForm: RequestFormState = {
  patient_id: "",
  surgeon_id: "",
  procedure_name: "",
  requested_date: "",
};

const initialSurgeryForm: SurgeryFormState = {
  operating_room_id: "",
  scheduled_start: "",
  scheduled_end: "",
};

function statusBadgeVariant(status: CaseRequestStatus) {
  if (status === "approved") return "secondary" as const;
  if (status === "rejected") return "destructive" as const;
  return "default" as const;
}

function formatName(first?: string | null, last?: string | null) {
  return `${first ?? ""} ${last ?? ""}`.trim() || "Unknown";
}

function SurgeryCreateModal({
  open,
  saving,
  rooms,
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  rooms: OperatingRoom[];
  form: SurgeryFormState;
  onChange: (field: keyof SurgeryFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl rounded-xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Create Surgery from Approved Request</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <Label htmlFor="or">Operating Room</Label>
            <Select
              value={form.operating_room_id || "none"}
              onValueChange={(value) => onChange("operating_room_id", value === "none" ? "" : value)}
            >
              <SelectTrigger id="or">
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
            <Label htmlFor="start">Scheduled Start</Label>
            <Input id="start" type="datetime-local" value={form.scheduled_start} onChange={(e) => onChange("scheduled_start", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="end">Scheduled End</Label>
            <Input id="end" type="datetime-local" value={form.scheduled_end} onChange={(e) => onChange("scheduled_end", e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
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
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);

  const [requestForm, setRequestForm] = useState<RequestFormState>(initialRequestForm);
  const [surgeryForm, setSurgeryForm] = useState<SurgeryFormState>(initialSurgeryForm);

  const [loading, setLoading] = useState(true);
  const [savingRequest, setSavingRequest] = useState(false);
  const [savingDecisionId, setSavingDecisionId] = useState<string | null>(null);
  const [savingSurgery, setSavingSurgery] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    const [patientsRes, surgeonsRes, requestsRes, surgeriesRes, roomsRes] = await Promise.all([
      patientsService.getAll(),
      surgeonsService.getAll(),
      caseRequestsService.getAll(),
      surgeriesService.getAll(),
      operatingRoomsService.getAll(),
    ]);

    if (patientsRes.error || surgeonsRes.error || requestsRes.error || surgeriesRes.error || roomsRes.error) {
      setError(
        patientsRes.error?.message ||
          surgeonsRes.error?.message ||
          requestsRes.error?.message ||
          surgeriesRes.error?.message ||
          roomsRes.error?.message ||
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
      setError("Patient, surgeon, procedure name, and requested date are required.");
      return;
    }

    setSavingRequest(true);
    setError(null);

    const payload = {
      patient_id: requestForm.patient_id,
      surgeon_id: requestForm.surgeon_id,
      procedure_name: requestForm.procedure_name.trim(),
      requested_date: new Date(requestForm.requested_date).toISOString(),
      status: "pending" as const,
    };

    const result = await caseRequestsService.create(payload);
    if (result.error) {
      setError(result.error.message);
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
    setError(null);

    const result = await caseRequestsService.update(requestId, { status });
    if (result.error) {
      setError(result.error.message);
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
      setError("Scheduled start and end are required to create surgery.");
      return;
    }

    setSavingSurgery(true);
    setError(null);

    const payload = {
      case_request_id: createSurgeryForRequestId,
      operating_room_id: surgeryForm.operating_room_id || null,
      scheduled_start: new Date(surgeryForm.scheduled_start).toISOString(),
      scheduled_end: new Date(surgeryForm.scheduled_end).toISOString(),
      status: "scheduled" as const,
    };

    const result = await surgeriesService.create(payload);
    if (result.error) {
      setError(result.error.message);
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
    setCreateSurgeryForRequestId(null);
    setSavingSurgery(false);
  };

  const openSurgeryModal = (requestId: string) => {
    setSurgeryForm(initialSurgeryForm);
    setCreateSurgeryForRequestId(requestId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Case Request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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
          {error ? <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

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
                          <Badge variant={statusBadgeVariant(req.status)}>{req.status}</Badge>
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
        rooms={rooms}
        form={surgeryForm}
        onChange={(field, value) => setSurgeryForm((prev) => ({ ...prev, [field]: value }))}
        onClose={() => !savingSurgery && setCreateSurgeryForRequestId(null)}
        onSubmit={onCreateSurgery}
      />
    </div>
  );
}
