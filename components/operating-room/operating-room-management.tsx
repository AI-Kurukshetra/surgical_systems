"use client";

import { useEffect, useMemo, useState } from "react";
import { hospitalsService } from "@/src/services/hospitals";
import { operatingRoomsService } from "@/src/services/operating_rooms";
import type { Hospital, ORStatus, OperatingRoom, OperatingRoomInsert, OperatingRoomUpdate } from "@/src/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FormState = {
  hospital_id: string;
  room_name: string;
  status: ORStatus;
};

const statusOptions: ORStatus[] = ["available", "in_surgery", "cleaning", "maintenance"];

const initialForm: FormState = {
  hospital_id: "",
  room_name: "",
  status: "available",
};

function toPayload(form: FormState): OperatingRoomInsert {
  return {
    hospital_id: form.hospital_id || null,
    room_name: form.room_name.trim() || null,
    status: form.status,
  };
}

function OperatingRoomModal({
  open,
  editing,
  saving,
  form,
  hospitals,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  editing: boolean;
  saving: boolean;
  form: FormState;
  hospitals: Hospital[];
  onClose: () => void;
  onChange: (field: keyof FormState, value: string) => void;
  onSave: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl rounded-xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{editing ? "Edit Operating Room" : "Create Operating Room"}</h2>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Close
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <Label htmlFor="or_hospital">Hospital</Label>
            <Select value={form.hospital_id || "none"} onValueChange={(value) => onChange("hospital_id", value === "none" ? "" : value)}>
              <SelectTrigger id="or_hospital">
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
            <Label htmlFor="or_room_name">Room Name</Label>
            <Input id="or_room_name" value={form.room_name} onChange={(e) => onChange("room_name", e.target.value)} placeholder="OR-1" />
          </div>

          <div>
            <Label htmlFor="or_status">Status</Label>
            <Select value={form.status} onValueChange={(value) => onChange("status", value)}>
              <SelectTrigger id="or_status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Room"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OperatingRoomManagement() {
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const hospitalMap = useMemo(() => new Map(hospitals.map((h) => [h.id, h.name])), [hospitals]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [roomsRes, hospitalsRes] = await Promise.all([operatingRoomsService.getAll(), hospitalsService.getAll()]);

    if (roomsRes.error || hospitalsRes.error) {
      setError(roomsRes.error?.message || hospitalsRes.error?.message || "Failed to load operating rooms.");
      setLoading(false);
      return;
    }

    setRooms(roomsRes.data ?? []);
    setHospitals(hospitalsRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (row: OperatingRoom) => {
    setEditingId(row.id);
    setForm({
      hospital_id: row.hospital_id ?? "",
      room_name: row.room_name ?? "",
      status: (row.status ?? "available") as ORStatus,
    });
    setOpen(true);
  };

  const onSave = async () => {
    if (!form.room_name.trim()) {
      setError("Room name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    const payload = toPayload(form);

    if (!editingId) {
      const result = await operatingRoomsService.create(payload);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
      if (result.data) {
        setRooms((prev) => [result.data as OperatingRoom, ...prev]);
      }
    } else {
      const result = await operatingRoomsService.update(editingId, payload as OperatingRoomUpdate);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
      if (result.data) {
        setRooms((prev) => prev.map((item) => (item.id === editingId ? (result.data as OperatingRoom) : item)));
      }
    }

    setSaving(false);
    setOpen(false);
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this operating room?");
    if (!confirmed) return;

    const result = await operatingRoomsService.delete(id);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    setRooms((prev) => prev.filter((room) => room.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Operating Rooms</CardTitle>
          <Button onClick={openCreate}>Add Room</Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Name</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Loading operating rooms...
                  </TableCell>
                </TableRow>
              ) : rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No operating rooms found.
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.room_name ?? "-"}</TableCell>
                    <TableCell>{row.hospital_id ? hospitalMap.get(row.hospital_id) ?? "Unknown" : "Unassigned"}</TableCell>
                    <TableCell>{row.status ?? "-"}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(row.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <OperatingRoomModal
        open={open}
        editing={Boolean(editingId)}
        saving={saving}
        form={form}
        hospitals={hospitals}
        onClose={() => !saving && setOpen(false)}
        onChange={onChange}
        onSave={onSave}
      />
    </Card>
  );
}
