export type AppRole = "admin" | "scheduler" | "surgeon" | "staff";

export function roleGuard(userRole: string | null | undefined, allowedRoles: AppRole[]) {
  if (!userRole) return false;
  const normalized = userRole.toLowerCase().trim() as AppRole;
  return allowedRoles.includes(normalized);
}

export function requireRole(userRole: string | null | undefined, allowedRoles: AppRole[]) {
  return roleGuard(userRole, allowedRoles);
}

export function createRoleGuard(allowedRoles: AppRole[]) {
  return (userRole: string | null | undefined) => roleGuard(userRole, allowedRoles);
}
