"use client";

import { useEffect, useMemo, useState } from "react";
import { hospitalsService } from "@/src/services/hospitals";
import { staffService } from "@/src/services/staff";
import type { Hospital, Staff, StaffInsert, StaffUpdate } from "@/src/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FormState = {
  name: string;
  email: string;
  role: string;
  hospital_id: string;
};

const STAFF_ROLES = ["staff"] as const;

const initialForm: FormState = {
  name: "",
  email: "",
  role: "staff",
  hospital_id: "",
};

function normalizePayload(form: FormState): StaffInsert {
  return {
    name: form.name.trim() || null,
    email: form.email.trim() || null,
    role: form.role.trim() || "staff",
    hospital_id: form.hospital_id || null,
  };
}

function StaffModal({
  open,
  form,
  hospitals,
  saving,
  editing,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  form: FormState;
  hospitals: Hospital[];
  saving: boolean;
  editing: boolean;
  onClose: () => void;
  onChange: (field: keyof FormState, value: string) => void;
  onSave: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl rounded-xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{editing ? "Edit Staff" : "Create Staff"}</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <Label htmlFor="staff_name">Name</Label>
            <Input id="staff_name" value={form.name} onChange={(e) => onChange("name", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="staff_email">Email</Label>
            <Input
              id="staff_email"
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="staff@example.com"
              disabled={!!editing}
            />
            {editing ? (
              <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed when editing.</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">A random password will be generated and sent to this email.</p>
            )}
          </div>

          <div>
            <Label htmlFor="staff_role">Role</Label>
            <Select value={form.role || "staff"} onValueChange={(value) => onChange("role", value)}>
              <SelectTrigger id="staff_role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="staff_hospital">Hospital</Label>
            <Select value={form.hospital_id || "none"} onValueChange={(value) => onChange("hospital_id", value === "none" ? "" : value)}>
              <SelectTrigger id="staff_hospital">
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
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Staff"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
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

    const [staffResult, hospitalsResult] = await Promise.all([staffService.getAll(), hospitalsService.getAll()]);

    if (staffResult.error) {
      setError(staffResult.error.message);
      setLoading(false);
      return;
    }

    if (hospitalsResult.error) {
      setError(hospitalsResult.error.message);
      setLoading(false);
      return;
    }

    setStaff(staffResult.data ?? []);
    setHospitals(hospitalsResult.data ?? []);
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

  const openEdit = (row: Staff) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      email: row.email ?? "",
      role: row.role ?? "staff",
      hospital_id: row.hospital_id ?? "",
    });
    setOpen(true);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    const payload = normalizePayload(form);

    if (!editingId) {
      const result = await staffService.create(payload);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
      if (result.data) {
        setStaff((prev) => [result.data as Staff, ...prev]);
      }
    } else {
      const result = await staffService.update(editingId, payload as StaffUpdate);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
      if (result.data) {
        setStaff((prev) => prev.map((item) => (item.id === editingId ? (result.data as Staff) : item)));
      }
    }

    setSaving(false);
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Staff Management</CardTitle>
          <Button onClick={openCreate}>Create Staff</Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading staff...
                  </TableCell>
                </TableRow>
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No staff found.
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name ?? "-"}</TableCell>
                    <TableCell>{row.email ?? "-"}</TableCell>
                    <TableCell>{row.role ?? "-"}</TableCell>
                    <TableCell>{row.hospital_id ? hospitalMap.get(row.hospital_id) ?? "Unknown" : "Unassigned"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <StaffModal
        open={open}
        form={form}
        hospitals={hospitals}
        saving={saving}
        editing={Boolean(editingId)}
        onClose={() => !saving && setOpen(false)}
        onChange={onChange}
        onSave={onSave}
      />
    </Card>
  );
}
