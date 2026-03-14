"use client";

import { useEffect, useState } from "react";
import { surgeonsService } from "@/src/services/surgeons";
import type { Surgeon, SurgeonInsert, SurgeonUpdate } from "@/src/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FormState = {
  name: string;
  specialization: string;
  email: string;
  phone: string;
};

const initialForm: FormState = {
  name: "",
  specialization: "",
  email: "",
  phone: "",
};

function normalizePayload(form: FormState): SurgeonInsert {
  return {
    hospital_id: null,
    name: form.name.trim() || null,
    specialization: form.specialization.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
  };
}

function SurgeonModal({
  open,
  form,
  saving,
  editing,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  form: FormState;
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
          <h2 className="text-lg font-semibold">{editing ? "Edit Surgeon" : "Create Surgeon"}</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <Label htmlFor="surgeon_name">Name</Label>
            <Input id="surgeon_name" value={form.name} onChange={(e) => onChange("name", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="surgeon_specialization">Specialization</Label>
            <Input
              id="surgeon_specialization"
              value={form.specialization}
              onChange={(e) => onChange("specialization", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="surgeon_email">Email</Label>
            <Input
              id="surgeon_email"
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="surgeon_phone">Phone</Label>
            <Input id="surgeon_phone" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Surgeon"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SurgeonManagement() {
  const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const result = await surgeonsService.getAll();
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }
    setSurgeons(result.data ?? []);
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

  const openEdit = (row: Surgeon) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      specialization: row.specialization ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
    });
    setOpen(true);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    const payload = normalizePayload(form);

    if (!editingId) {
      const result = await surgeonsService.create(payload);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
      if (result.data) {
        setSurgeons((prev) => [result.data as Surgeon, ...prev]);
      }
    } else {
      const result = await surgeonsService.update(editingId, payload as SurgeonUpdate);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
      if (result.data) {
        setSurgeons((prev) => prev.map((item) => (item.id === editingId ? (result.data as Surgeon) : item)));
      }
    }

    setSaving(false);
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Surgeon Management</CardTitle>
          <Button onClick={openCreate}>Create Surgeon</Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading surgeons...
                  </TableCell>
                </TableRow>
              ) : surgeons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No surgeons found.
                  </TableCell>
                </TableRow>
              ) : (
                surgeons.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name ?? "-"}</TableCell>
                    <TableCell>{row.specialization ?? "-"}</TableCell>
                    <TableCell>{row.email ?? "-"}</TableCell>
                    <TableCell>{row.phone ?? "-"}</TableCell>
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

      <SurgeonModal
        open={open}
        form={form}
        saving={saving}
        editing={Boolean(editingId)}
        onClose={() => !saving && setOpen(false)}
        onChange={onChange}
        onSave={onSave}
      />
    </Card>
  );
}
