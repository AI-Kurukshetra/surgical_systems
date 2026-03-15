import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function minutesBetween(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
}

/** Format status for display: capitalise each word and replace underscores with spaces (e.g. "approved" → "Approved", "in_progress" → "In Progress"). */
export function formatStatus(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Badge variant type for status badges (matches Badge component variants). */
export type StatusBadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";

/** Map status name to badge variant. Same status name uses the same colour project-wide. */
export function getStatusBadgeVariant(status: string | null | undefined): StatusBadgeVariant {
  if (status == null || status === "") return "secondary";
  const s = status.toLowerCase();
  if (["cancelled", "rejected", "delayed"].includes(s)) return "destructive";
  if (["completed", "approved", "available"].includes(s)) return "success";
  if (["scheduled", "in_surgery"].includes(s)) return "info";
  if (["in_progress", "pending", "cleaning", "in_use"].includes(s)) return "warning";
  if (s === "maintenance") return "secondary";
  return "default";
}
