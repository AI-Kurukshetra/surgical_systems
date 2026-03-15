"use client";

import { useEffect, useMemo, useState } from "react";
import { equipmentService } from "@/src/services/equipment";
import { equipmentAssignmentsService } from "@/src/services/equipment_assignments";
import { hospitalsService } from "@/src/services/hospitals";
import { surgeriesService } from "@/src/services/surgeries";
import type { Equipment, EquipmentAssignment, EquipmentStatus, Hospital, Surgery } from "@/src/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStatus } from "@/lib/utils";

const statuses: EquipmentStatus[] = ["available", "in_use", "maintenance"];

type FormState = {
  name: string;
  hospital_id: string;
  status: EquipmentStatus;
};

const initialForm: FormState = {
  name: "",
  hospital_id: "",
  status: "available",
};

export function EquipmentManagement() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [equipmentAssignments, setEquipmentAssignments] = useState<EquipmentAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedSurgeryByEquipment, setSelectedSurgeryByEquipment] = useState<Record<string, string>>({});

  const surgeriesByEquipment = useMemo(() => {
    return equipmentAssignments.reduce<Record<string, string[]>>((acc, assignment) => {
      if (!assignment.equipment_id || !assignment.surgery_id) return acc;
      if (!acc[assignment.equipment_id]) acc[assignment.equipment_id] = [];
      acc[assignment.equipment_id].push(assignment.surgery_id);
      return acc;
    }, {});
  }, [equipmentAssignments]);

  const surgeryMap = useMemo(() => new Map(surgeries.map((s) => [s.id, s])), [surgeries]);
  const hospitalMap = useMemo(() => new Map(hospitals.map((h) => [h.id, h.name])), [hospitals]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [equipmentRes, hospitalsRes, surgeriesRes, assignmentsRes] = await Promise.all([
      equipmentService.getAll(),
      hospitalsService.getAll(),
      surgeriesService.getAll(),
      equipmentAssignmentsService.getAll(),
    ]);

    if (equipmentRes.error || hospitalsRes.error || surgeriesRes.error || assignmentsRes.error) {
      setError(
        equipmentRes.error?.message ||
          hospitalsRes.error?.message ||
          surgeriesRes.error?.message ||
          assignmentsRes.error?.message ||
          "Failed to load equipment data.",
      );
      setLoading(false);
      return;
    }

    setEquipment(equipmentRes.data ?? []);
    setHospitals(hospitalsRes.data ?? []);
    setSurgeries(surgeriesRes.data ?? []);
    setEquipmentAssignments(assignmentsRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onAddEquipment = async () => {
    if (!form.name.trim()) {
      setError("Equipment name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await equipmentService.create({
      hospital_id: form.hospital_id || null,
      name: form.name.trim(),
      status: form.status,
    });

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    if (result.data) {
      setEquipment((prev) => [result.data as Equipment, ...prev]);
    }

    closeModal();
    setSaving(false);
  };

  const openEditModal = (item: Equipment) => {
    setEditingEquipment(item);
    setForm({
      name: item.name ?? "",
      hospital_id: item.hospital_id ?? "",
      status: (item.status ?? "available") as EquipmentStatus,
    });
    setAddOpen(true);
  };

  const closeModal = () => {
    setAddOpen(false);
    setEditingEquipment(null);
    setForm(initialForm);
  };

  const onEditEquipment = async () => {
    if (!editingEquipment) return;
    if (!form.name.trim()) {
      setError("Equipment name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await equipmentService.update(editingEquipment.id, {
      hospital_id: form.hospital_id || null,
      name: form.name.trim(),
      status: form.status,
    });

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    if (result.data) {
      setEquipment((prev) => prev.map((item) => (item.id === editingEquipment.id ? (result.data as Equipment) : item)));
    }

    closeModal();
    setSaving(false);
  };

  const onUpdateStatus = async (equipmentId: string, status: EquipmentStatus) => {
    const result = await equipmentService.update(equipmentId, { status });
    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (result.data) {
      setEquipment((prev) => prev.map((item) => (item.id === equipmentId ? (result.data as Equipment) : item)));
    }
  };

  const onAssignToSurgery = async (equipmentId: string) => {
    const surgeryId = selectedSurgeryByEquipment[equipmentId];
    if (!surgeryId) {
      setError("Select a surgery before assigning equipment.");
      return;
    }

    const alreadyAssigned = equipmentAssignments.some(
      (assignment) => assignment.equipment_id === equipmentId && assignment.surgery_id === surgeryId,
    );

    if (alreadyAssigned) {
      setError("Equipment is already assigned to this surgery.");
      return;
    }

    const result = await equipmentAssignmentsService.create({ surgery_id: surgeryId, equipment_id: equipmentId });
    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (result.data) {
      setEquipmentAssignments((prev) => [result.data as EquipmentAssignment, ...prev]);
    }

    setSelectedSurgeryByEquipment((prev) => ({ ...prev, [equipmentId]: "" }));
  };

  const surgeryLabel = (surgery: Surgery | undefined) => {
    if (!surgery) return "Unknown";
    const room = surgery.operating_room_id ? `OR ${surgery.operating_room_id.slice(0, 6)}` : "No OR";
    const start = surgery.scheduled_start ? new Date(surgery.scheduled_start).toLocaleString() : "No start";
    return `${room} | ${start}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Equipment Management</CardTitle>
          <Button onClick={() => { setEditingEquipment(null); setForm(initialForm); setAddOpen(true); }}>Add Equipment</Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Surgeries</TableHead>
                <TableHead>Assign To Surgery</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {              loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading equipment...
                  </TableCell>
                </TableRow>
              ) : equipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No equipment found.
                  </TableCell>
                </TableRow>
              ) : (
                equipment.map((item) => {
                  const assignedSurgeryIds = surgeriesByEquipment[item.id] ?? [];
                  const assignedLabels = assignedSurgeryIds.map((id) => surgeryLabel(surgeryMap.get(id)));

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.name ?? "-"}</TableCell>
                      <TableCell>{item.hospital_id ? hospitalMap.get(item.hospital_id) ?? "Unknown" : "Unassigned"}</TableCell>
                      <TableCell>
                        <Select value={item.status ?? "available"} onValueChange={(value) => void onUpdateStatus(item.id, value as EquipmentStatus)}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {formatStatus(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {assignedLabels.length === 0 ? "-" : assignedLabels.slice(0, 2).join("; ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={selectedSurgeryByEquipment[item.id] || "none"}
                            onValueChange={(value) =>
                              setSelectedSurgeryByEquipment((prev) => ({ ...prev, [item.id]: value === "none" ? "" : value }))
                            }
                          >
                            <SelectTrigger className="w-60">
                              <SelectValue placeholder="Select surgery" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select surgery</SelectItem>
                              {surgeries.map((surgery) => (
                                <SelectItem key={surgery.id} value={surgery.id}>
                                  {surgeryLabel(surgery)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={() => void onAssignToSurgery(item.id)}>
                            Assign
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {addOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{editingEquipment ? "Edit Equipment" : "Add Equipment"}</h2>
              <Button variant="ghost" onClick={() => !saving && closeModal()}>
                Close
              </Button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <Label htmlFor="equipment_name">Equipment Name</Label>
                <Input
                  id="equipment_name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Anesthesia Machine"
                />
              </div>
              <div>
                <Label htmlFor="equipment_hospital">Hospital</Label>
                <Select
                  value={form.hospital_id || "none"}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, hospital_id: value === "none" ? "" : value }))}
                >
                  <SelectTrigger id="equipment_hospital">
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="equipment_status">Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as EquipmentStatus }))}>
                  <SelectTrigger id="equipment_status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
{statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatus(status)}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={() => !saving && closeModal()} disabled={saving}>
                Cancel
              </Button>
              {editingEquipment ? (
                <Button onClick={() => void onEditEquipment()} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              ) : (
                <Button onClick={() => void onAddEquipment()} disabled={saving}>
                  {saving ? "Saving..." : "Add Equipment"}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
