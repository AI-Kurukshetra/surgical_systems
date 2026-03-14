"use client";

import { useEffect, useState } from "react";
import { CreateHospitalForm } from "@/components/admin/hospitals/create-hospital-form";
import { EditHospitalForm } from "@/components/admin/hospitals/edit-hospital-form";
import { initialHospitalForm, type HospitalFormState } from "@/components/admin/hospitals/hospital-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hospitalsService } from "@/src/services";
import type { Hospital, HospitalInsert } from "@/src/services/types";

function toPayload(form: HospitalFormState): HospitalInsert {
  const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  return {
    name: toNullable(form.name),
    address: toNullable(form.address),
    city: toNullable(form.city),
    state: toNullable(form.state),
    country: toNullable(form.country),
    phone: toNullable(form.phone),
    email: toNullable(form.email),
  };
}

function toForm(row: Hospital): HospitalFormState {
  return {
    name: row.name ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    country: row.country ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
  };
}

export function HospitalManagement() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HospitalFormState>(initialHospitalForm);

  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    const loadHospitals = async () => {
      setLoading(true);
      setError(null);

      const result = await hospitalsService.getAll();
      if (result.error) {
        setError("Unable to load hospitals. Please try again.");
        setLoading(false);
        return;
      }

      setHospitals(result.data ?? []);
      setLoading(false);
    };

    void loadHospitals();
  }, []);

  const onChange = (field: keyof HospitalFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onOpenCreate = () => {
    setForm(initialHospitalForm);
    setError(null);
    setCreateOpen(true);
  };

  const onOpenEdit = (hospital: Hospital) => {
    setForm(toForm(hospital));
    setEditingId(hospital.id);
    setError(null);
    setEditOpen(true);
  };

  const onCreate = async () => {
    setSaving(true);
    setError(null);

    const payload = toPayload(form);
    if (!payload.name) {
      setError("Hospital name is required.");
      setSaving(false);
      return;
    }

    const result = await hospitalsService.create(payload);
    if (result.error || !result.data) {
      setError("Unable to save hospital. Please try again.");
      setSaving(false);
      return;
    }

    setHospitals((prev) => [...prev, result.data as Hospital].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")));
    setCreateOpen(false);
    setForm(initialHospitalForm);
    setToastMessage("Hospital created successfully");
    setSaving(false);
  };

  const onUpdate = async () => {
    if (!editingId) return;

    setSaving(true);
    setError(null);

    const payload = toPayload(form);
    if (!payload.name) {
      setError("Hospital name is required.");
      setSaving(false);
      return;
    }

    const result = await hospitalsService.update(editingId, payload);
    if (result.error || !result.data) {
      setError("Unable to save hospital. Please try again.");
      setSaving(false);
      return;
    }

    setHospitals((prev) => prev.map((item) => (item.id === editingId ? (result.data as Hospital) : item)));
    setEditOpen(false);
    setEditingId(null);
    setForm(initialHospitalForm);
    setToastMessage("Hospital updated successfully");
    setSaving(false);
  };

  const onDelete = async (hospital: Hospital) => {
    const confirmed = window.confirm(`Delete ${hospital.name ?? "this hospital"}?`);
    if (!confirmed) return;

    setDeletingId(hospital.id);
    setError(null);

    const result = await hospitalsService.delete(hospital.id);
    if (result.error) {
      setError("Unable to delete hospital. Please try again.");
      setDeletingId(null);
      return;
    }

    setHospitals((prev) => prev.filter((item) => item.id !== hospital.id));
    setToastMessage("Hospital deleted successfully");
    setDeletingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Hospital Management</CardTitle>
          <Button onClick={onOpenCreate}>+ Add Hospital</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading hospitals...
                  </TableCell>
                </TableRow>
              ) : hospitals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hospitals found.
                  </TableCell>
                </TableRow>
              ) : (
                hospitals.map((hospital) => (
                  <TableRow key={hospital.id}>
                    <TableCell>{hospital.name ?? "-"}</TableCell>
                    <TableCell>{hospital.city ?? "-"}</TableCell>
                    <TableCell>{hospital.state ?? "-"}</TableCell>
                    <TableCell>{hospital.country ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenEdit(hospital)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void onDelete(hospital)}
                          disabled={deletingId === hospital.id}
                        >
                          {deletingId === hospital.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CreateHospitalForm
        open={createOpen}
        form={form}
        saving={saving}
        onClose={() => !saving && setCreateOpen(false)}
        onChange={onChange}
        onSubmit={() => void onCreate()}
      />

      <EditHospitalForm
        open={editOpen}
        form={form}
        saving={saving}
        onClose={() => !saving && setEditOpen(false)}
        onChange={onChange}
        onSubmit={() => void onUpdate()}
      />

      {toastMessage ? (
        <div className="fixed right-4 top-4 z-[60] rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </Card>
  );
}
