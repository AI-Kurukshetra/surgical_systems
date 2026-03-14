"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type HospitalFormState = {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
};

export const initialHospitalForm: HospitalFormState = {
  name: "",
  address: "",
  city: "",
  state: "",
  country: "",
  phone: "",
  email: "",
};

export function HospitalFormFields({
  form,
  onChange,
}: {
  form: HospitalFormState;
  onChange: (field: keyof HospitalFormState, value: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="hospital_name">Hospital Name</Label>
        <Input id="hospital_name" value={form.name} onChange={(event) => onChange("name", event.target.value)} />
      </div>

      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="hospital_address">Address</Label>
        <Input id="hospital_address" value={form.address} onChange={(event) => onChange("address", event.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="hospital_city">City</Label>
        <Input id="hospital_city" value={form.city} onChange={(event) => onChange("city", event.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="hospital_state">State</Label>
        <Input id="hospital_state" value={form.state} onChange={(event) => onChange("state", event.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="hospital_country">Country</Label>
        <Input id="hospital_country" value={form.country} onChange={(event) => onChange("country", event.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="hospital_phone">Phone</Label>
        <Input id="hospital_phone" value={form.phone} onChange={(event) => onChange("phone", event.target.value)} />
      </div>

      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="hospital_email">Email</Label>
        <Input
          id="hospital_email"
          type="email"
          value={form.email}
          onChange={(event) => onChange("email", event.target.value)}
        />
      </div>
    </div>
  );
}
