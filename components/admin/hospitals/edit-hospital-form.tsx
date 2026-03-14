"use client";

import { Button } from "@/components/ui/button";
import { HospitalFormFields, type HospitalFormState } from "@/components/admin/hospitals/hospital-form-fields";

export function EditHospitalForm({
  open,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: HospitalFormState;
  saving: boolean;
  onClose: () => void;
  onChange: (field: keyof HospitalFormState, value: string) => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Edit Hospital</h2>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Close
          </Button>
        </div>

        <div className="p-6">
          <HospitalFormFields form={form} onChange={onChange} />
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
