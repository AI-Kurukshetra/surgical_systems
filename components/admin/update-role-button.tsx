"use client";

import { Button } from "@/components/ui/button";

export function UpdateRoleButton({
  disabled,
  loading,
  onClick,
}: {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" size="sm" disabled={disabled || loading} onClick={onClick}>
      {loading ? "Updating..." : "Update Role"}
    </Button>
  );
}
