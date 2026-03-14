"use client";

import { useEffect, useMemo, useState } from "react";
import { patientsService } from "@/src/services/patients";
import type { Patient, PatientInsert, PatientUpdate } from "@/src/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ModalMode = "add" | "edit";

type PatientFormState = {
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
};

const PAGE_SIZE = 8;

const initialForm: PatientFormState = {
  first_name: "",
  last_name: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
};

function toInputValue(value: string | null | undefined) {
  return value ?? "";
}

function patientToForm(patient: Patient): PatientFormState {
  return {
    first_name: toInputValue(patient.first_name),
    last_name: toInputValue(patient.last_name),
    dob: toInputValue(patient.dob),
    gender: toInputValue(patient.gender),
    phone: toInputValue(patient.phone),
    email: toInputValue(patient.email),
  };
}

function normalizePayload(form: PatientFormState): PatientInsert {
  return {
    first_name: form.first_name.trim() || null,
    last_name: form.last_name.trim() || null,
    dob: form.dob || null,
    gender: form.gender.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
  };
}

function PatientModal({
  open,
  mode,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  mode: ModalMode;
  form: PatientFormState;
  saving: boolean;
  onClose: () => void;
  onChange: (field: keyof PatientFormState, value: string) => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{mode === "add" ? "Add Patient" : "Edit Patient"}</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => onChange("first_name", e.target.value)}
              placeholder="John"
            />
          </div>

          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => onChange("last_name", e.target.value)}
              placeholder="Doe"
            />
          </div>

          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date" value={form.dob} onChange={(e) => onChange("dob", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={form.gender || "unspecified"} onValueChange={(value) => onChange("gender", value === "unspecified" ? "" : value)}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">Unspecified</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="+1 555 123 7890"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="patient@example.com"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : mode === "add" ? "Create Patient" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [form, setForm] = useState<PatientFormState>(initialForm);

  const loadPatients = async () => {
    setLoading(true);
    setError(null);

    const result = await patientsService.getAll();
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    setPatients(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) => {
      const fullName = `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim().toLowerCase();
      return fullName.includes(query);
    });
  }, [patients, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPatients.slice(start, start + PAGE_SIZE);
  }, [filteredPatients, page]);

  const openAddModal = () => {
    setModalMode("add");
    setEditingPatientId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setModalMode("edit");
    setEditingPatientId(patient.id);
    setForm(patientToForm(patient));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const onFormChange = (field: keyof PatientFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);

    const payload = normalizePayload(form);

    if (modalMode === "add") {
      const result = await patientsService.create(payload);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }

      if (result.data) {
        setPatients((prev) => [result.data as Patient, ...prev]);
      }
    } else {
      if (!editingPatientId) {
        setError("Missing patient id for edit.");
        setSaving(false);
        return;
      }

      const result = await patientsService.update(editingPatientId, payload as PatientUpdate);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }

      if (result.data) {
        setPatients((prev) => prev.map((item) => (item.id === editingPatientId ? (result.data as Patient) : item)));
      }
    }

    setSaving(false);
    setModalOpen(false);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <CardTitle>Patient Management</CardTitle>
          <Button onClick={openAddModal}>Add Patient</Button>
        </div>

        <Input
          placeholder="Search by patient name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </CardHeader>

      <CardContent>
        {error ? <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading patients...
                  </TableCell>
                </TableRow>
              ) : pageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No patients found.
                  </TableCell>
                </TableRow>
              ) : (
                pageData.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.first_name ?? "-"}</TableCell>
                    <TableCell>{patient.last_name ?? "-"}</TableCell>
                    <TableCell>{patient.dob ?? "-"}</TableCell>
                    <TableCell className="capitalize">{patient.gender ?? "-"}</TableCell>
                    <TableCell>{patient.phone ?? "-"}</TableCell>
                    <TableCell>{patient.email ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(patient)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      <PatientModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        saving={saving}
        onClose={closeModal}
        onChange={onFormChange}
        onSubmit={onSave}
      />
    </Card>
  );
}
