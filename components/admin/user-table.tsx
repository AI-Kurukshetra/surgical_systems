"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleDropdown } from "@/components/admin/role-dropdown";
import { UpdateRoleButton } from "@/components/admin/update-role-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Role, UserProfile } from "@/src/services/types";

export function UserTable({
  users,
  updatingIds,
  onUpdateRole,
}: {
  users: UserProfile[];
  updatingIds: string[];
  onUpdateRole: (id: string, role: Role) => void;
}) {
  const initialById = useMemo(
    () =>
      users.reduce<Record<string, Role>>((acc, user) => {
        acc[user.id] = (user.role ?? "staff") as Role;
        return acc;
      }, {}),
    [users],
  );

  const [selectedRoleById, setSelectedRoleById] = useState<Record<string, Role>>(initialById);

  useEffect(() => {
    setSelectedRoleById(initialById);
  }, [initialById]);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const currentRole = (user.role ?? "staff") as Role;
              const selected = selectedRoleById[user.id] ?? currentRole;
              const updating = updatingIds.includes(user.id);
              const changed = selected !== currentRole;

              return (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name ?? "-"}</TableCell>
                  <TableCell>{user.email ?? "-"}</TableCell>
                  <TableCell>
                    <RoleDropdown
                      value={selected}
                      disabled={updating}
                      onChange={(next) => setSelectedRoleById((prev) => ({ ...prev, [user.id]: next }))}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <UpdateRoleButton disabled={!changed} loading={updating} onClick={() => onUpdateRole(user.id, selected)} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
