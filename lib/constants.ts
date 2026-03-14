import type { UserRole } from "@/types/domain";

export const APP_NAME = "SmartOR";

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/or-dashboard",
  "/surgeries",
  "/case-requests",
  "/schedule",
  "/patients",
  "/surgeons",
  "/staff",
  "/equipment",
  "/analytics",
  "/settings",
  "/admin",
  "/waiting-role",
];

export const ROLE_ROUTE_ACCESS: Record<string, UserRole[]> = {
  "/admin": ["admin"],
  "/scheduler": ["admin", "scheduler"],
  "/surgeon": ["admin", "surgeon"],
  "/staff": ["admin", "staff"],
  "/settings": ["admin"],
  "/analytics": ["admin", "scheduler"],
};
