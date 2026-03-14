"use client";

import { useEffect, useState } from "react";
import { UserTable } from "@/components/admin/user-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usersService } from "@/src/services";
import type { Role, UserProfile } from "@/src/services/types";

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      const result = await usersService.getAll();
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      setUsers(result.data ?? []);
      setLoading(false);
    };

    void loadUsers();
  }, []);

  const onUpdateRole = async (id: string, role: Role) => {
    setUpdatingIds((prev) => [...prev, id]);
    setError(null);

    const result = await usersService.updateRole(id, role);
    if (result.error || !result.data) {
      setError(result.error?.message ?? "Failed to update role.");
      setUpdatingIds((prev) => prev.filter((item) => item !== id));
      return;
    }

    setUsers((prev) => prev.map((user) => (user.id === id ? (result.data as UserProfile) : user)));
    setUpdatingIds((prev) => prev.filter((item) => item !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading users...</p>
        ) : (
          <UserTable users={users} updatingIds={updatingIds} onUpdateRole={onUpdateRole} />
        )}
      </CardContent>
    </Card>
  );
}
