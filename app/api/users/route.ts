import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type UserRole = "admin" | "scheduler" | "surgeon" | "staff";
const allowedRoles: UserRole[] = ["admin", "scheduler", "surgeon", "staff"];
type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole | null;
  created_at: string;
};

function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && allowedRoles.includes(value as UserRole);
}

function getId(req: Request) {
  return new URL(req.url).searchParams.get("id");
}

function isSchemaMismatch(message: string | undefined) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find") ||
    normalized.includes("column") ||
    normalized.includes("relation")
  );
}

function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isValidRole(normalized) ? normalized : null;
}

function mapFromProfilesRow(row: Record<string, unknown>): UserRow {
  return {
    id: row.id as string,
    email: (row.email as string | null | undefined) ?? null,
    full_name: (row.full_name as string | null | undefined) ?? null,
    role: normalizeRole(row.role),
    created_at: (row.created_at as string | null | undefined) ?? new Date(0).toISOString(),
  };
}

function mapFromUsersRow(row: Record<string, unknown>): UserRow {
  return {
    id: row.id as string,
    email: (row.email as string | null | undefined) ?? null,
    full_name: ((row.full_name as string | null | undefined) ?? (row.name as string | null | undefined) ?? null) as
      | string
      | null,
    role: normalizeRole(row.role),
    created_at: (row.created_at as string | null | undefined) ?? new Date(0).toISOString(),
  };
}

function extractJoinRole(roles: unknown): UserRole | null {
  if (!roles) return null;
  if (Array.isArray(roles) && roles.length > 0) {
    return normalizeRole((roles[0] as { name?: unknown }).name);
  }

  if (typeof roles === "object") {
    return normalizeRole((roles as { name?: unknown }).name);
  }

  return null;
}

async function listAllUsers() {
  const adminSupabase = getSupabaseAdminClient();

  const fromProfiles = await adminSupabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .order("created_at", { ascending: false });
  if (!fromProfiles.error) {
    return (fromProfiles.data ?? []).map((row) => mapFromProfilesRow(row as Record<string, unknown>));
  }
  if (!isSchemaMismatch(fromProfiles.error.message)) {
    throw new Error(fromProfiles.error.message);
  }

  const fromUsersDirect = await adminSupabase
    .from("users")
    .select("id,email,full_name,name,role,created_at")
    .order("created_at", { ascending: false });
  if (!fromUsersDirect.error) {
    return (fromUsersDirect.data ?? []).map((row) => mapFromUsersRow(row as Record<string, unknown>));
  }
  if (!isSchemaMismatch(fromUsersDirect.error.message)) {
    throw new Error(fromUsersDirect.error.message);
  }

  const fromUsersRoleJoin = await adminSupabase
    .from("users")
    .select("id,email,full_name,name,created_at,roles(name)")
    .order("created_at", { ascending: false });
  if (!fromUsersRoleJoin.error) {
    return (fromUsersRoleJoin.data ?? []).map((row) => {
      const asRow = row as Record<string, unknown>;
      return {
        ...mapFromUsersRow(asRow),
        role: extractJoinRole(asRow.roles),
      };
    });
  }

  throw new Error(fromUsersRoleJoin.error.message);
}

async function updateRoleInUsersTable(userId: string, nextRole: UserRole) {
  const adminSupabase = getSupabaseAdminClient();

  const direct = await adminSupabase.from("users").update({ role: nextRole } as never).eq("id", userId);
  if (!direct.error) return;
  if (!isSchemaMismatch(direct.error.message)) {
    throw new Error(direct.error.message);
  }

  const roleLookup = await adminSupabase.from("roles").select("id").eq("name", nextRole).maybeSingle();
  if (roleLookup.error) {
    if (!isSchemaMismatch(roleLookup.error.message)) throw new Error(roleLookup.error.message);
    return;
  }

  const roleRow = roleLookup.data as { id?: string } | null;
  const roleId = roleRow?.id;
  if (!roleId) return;

  const roleIdUpdate = await adminSupabase.from("users").update({ role_id: roleId } as never).eq("id", userId);
  if (roleIdUpdate.error && !isSchemaMismatch(roleIdUpdate.error.message)) {
    throw new Error(roleIdUpdate.error.message);
  }
}

async function updateRoleInProfilesTable(userId: string, nextRole: UserRole) {
  const adminSupabase = getSupabaseAdminClient();
  const response = await adminSupabase.from("profiles").update({ role: nextRole } as never).eq("id", userId);

  if (response.error && !isSchemaMismatch(response.error.message)) {
    throw new Error(response.error.message);
  }
}

async function updateRoleInAuthMetadata(userId: string, nextRole: UserRole) {
  const adminSupabase = getSupabaseAdminClient();
  const current = await adminSupabase.auth.admin.getUserById(userId);
  if (current.error || !current.data.user) {
    throw new Error(current.error?.message ?? "User not found in auth.users");
  }

  const updated = await adminSupabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(current.data.user.app_metadata ?? {}),
      role: nextRole,
    },
    user_metadata: {
      ...(current.data.user.user_metadata ?? {}),
      role: nextRole,
    },
  });

  if (updated.error) {
    throw new Error(updated.error.message);
  }
}

async function getUserAfterRoleUpdate(userId: string): Promise<UserRow | null> {
  const users = await listAllUsers();
  return users.find((user) => user.id === userId) ?? null;
}

export async function GET() {
  const { user, role } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin"])) return errorResponse("Forbidden", 403);

  try {
    const users = await listAllUsers();
    const filteredUsers = users.filter((entry) => entry.id !== user.id);
    return successResponse(filteredUsers);
  } catch (error) {
    return errorResponse((error as Error).message, 400);
  }
}

export async function PUT(req: Request) {
  const { user, role } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const body = raw as Record<string, unknown>;
  const userId = (body.id as string | undefined) ?? getId(req);
  const nextRole = body.role;

  if (!userId) return errorResponse("id is required", 400);
  if (!isValidRole(nextRole)) return errorResponse("Invalid role", 400);
  if (userId === user.id) return errorResponse("You don't have permission to view this resource.", 403);

  try {
    await Promise.all([
      updateRoleInProfilesTable(userId, nextRole),
      updateRoleInUsersTable(userId, nextRole),
      updateRoleInAuthMetadata(userId, nextRole),
    ]);

    const updatedUser = await getUserAfterRoleUpdate(userId);
    if (!updatedUser) {
      return successResponse(
        {
          id: userId,
          role: nextRole,
        },
        200,
      );
    }

    return successResponse(updatedUser);
  } catch (error) {
    return errorResponse((error as Error).message, 400);
  }
}
