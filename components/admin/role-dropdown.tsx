"use client";

import type { Role } from "@/src/services/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const roleOptions: Role[] = ["admin", "scheduler", "surgeon", "staff"];

export function RoleDropdown({
  value,
  disabled,
  onChange,
}: {
  value: Role;
  disabled?: boolean;
  onChange: (value: Role) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as Role)} disabled={disabled}>
      <SelectTrigger className="w-40 bg-transparent">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {roleOptions.map((role) => (
          <SelectItem key={role} value={role}>
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
