import type { SupabaseClient, User } from "@supabase/supabase-js";

const ADMIN_ROLE = "admin";
const DEFAULT_ADMIN_NAME = "SmartOR Admin";

type SupabaseLike = SupabaseClient;

export type InitializeAdminInput = {
  email: string;
  password: string;
  name?: string | null;
};

export type InitializeAdminResult = {
  userId: string;
  email: string;
  createdAuthUser: boolean;
  usersWriteMode: "name_role" | "full_name_role" | "full_name_role_id" | "name_role_id";
  profilesSynced: boolean;
};

export class AdminInitializationError extends Error {
  code: "ADMIN_ALREADY_INITIALIZED" | "AUTH_CREATE_FAILED" | "USERS_UPSERT_FAILED" | "INVALID_INPUT";

  constructor(code: AdminInitializationError["code"], message: string) {
    super(message);
    this.name = "AdminInitializationError";
    this.code = code;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeRole(value: unknown) {
  if (typeof value !== "string") return null;
  const next = value.trim().toLowerCase();
  return next === ADMIN_ROLE ? ADMIN_ROLE : null;
}

function isSchemaMismatch(message: string | undefined) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find the") ||
    normalized.includes("not embedded because") ||
    normalized.includes("relation") ||
    normalized.includes("column")
  );
}

function looksLikeDuplicateAuthError(message: string | undefined) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("already registered") || normalized.includes("already exists");
}

async function hasAdminInUsersRoleColumn(supabase: SupabaseLike) {
  const { data, error } = await supabase.from("users").select("id").eq("role", ADMIN_ROLE).limit(1);
  if (!error) return (data ?? []).length > 0;
  if (isSchemaMismatch(error.message)) return false;
  throw new Error(error.message);
}

async function hasAdminInUsersRoleIdColumn(supabase: SupabaseLike) {
  const adminRole = await supabase.from("roles").select("id").eq("name", ADMIN_ROLE).maybeSingle();
  if (adminRole.error) {
    if (isSchemaMismatch(adminRole.error.message)) return false;
    throw new Error(adminRole.error.message);
  }

  const adminRoleId = adminRole.data?.id;
  if (!adminRoleId) return false;

  const users = await supabase.from("users").select("id").eq("role_id", adminRoleId).limit(1);
  if (!users.error) return (users.data ?? []).length > 0;
  if (isSchemaMismatch(users.error.message)) return false;
  throw new Error(users.error.message);
}

async function hasAdminInProfiles(supabase: SupabaseLike) {
  const { data, error } = await supabase.from("profiles").select("id").eq("role", ADMIN_ROLE).limit(1);
  if (!error) return (data ?? []).length > 0;
  if (isSchemaMismatch(error.message)) return false;
  throw new Error(error.message);
}

async function findAuthUserByEmail(supabase: SupabaseLike, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) throw new Error(error.message);

  return (
    data.users.find((user) => normalizeEmail(user.email ?? "") === normalizedEmail) ?? null
  );
}

async function hasAdminInAuthMetadata(supabase: SupabaseLike) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) throw new Error(error.message);

  return data.users.some(
    (user) =>
      normalizeRole(user.user_metadata?.role) === ADMIN_ROLE || normalizeRole(user.app_metadata?.role) === ADMIN_ROLE,
  );
}

export async function isAdminInitialized(supabase: SupabaseLike) {
  if (await hasAdminInUsersRoleColumn(supabase)) return true;
  if (await hasAdminInUsersRoleIdColumn(supabase)) return true;
  if (await hasAdminInProfiles(supabase)) return true;
  if (await hasAdminInAuthMetadata(supabase)) return true;
  return false;
}

async function createOrUpdateAuthAdminUser(
  supabase: SupabaseLike,
  params: { email: string; password: string; name: string },
): Promise<{ user: User; created: boolean }> {
  const metadata = { role: ADMIN_ROLE, full_name: params.name, name: params.name };
  const { data, error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    app_metadata: { role: ADMIN_ROLE },
    user_metadata: metadata,
  });

  if (!error && data.user) {
    return { user: data.user, created: true };
  }

  if (!looksLikeDuplicateAuthError(error?.message)) {
    throw new AdminInitializationError(
      "AUTH_CREATE_FAILED",
      error?.message ?? "Unable to create admin user in auth.users",
    );
  }

  const existing = await findAuthUserByEmail(supabase, params.email);
  if (!existing) {
    throw new AdminInitializationError("AUTH_CREATE_FAILED", "Admin user exists but could not be loaded from auth.users");
  }

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    email_confirm: true,
    password: params.password,
    app_metadata: {
      ...(existing.app_metadata ?? {}),
      role: ADMIN_ROLE,
    },
    user_metadata: {
      ...(existing.user_metadata ?? {}),
      ...metadata,
    },
  });

  if (updateError || !updated.user) {
    throw new AdminInitializationError(
      "AUTH_CREATE_FAILED",
      updateError?.message ?? "Unable to update existing auth user with admin role",
    );
  }

  return { user: updated.user, created: false };
}

async function getAdminRoleId(supabase: SupabaseLike) {
  const selected = await supabase.from("roles").select("id").eq("name", ADMIN_ROLE).maybeSingle();
  if (!selected.error && selected.data?.id) return selected.data.id as string;
  if (selected.error && !isSchemaMismatch(selected.error.message)) throw new Error(selected.error.message);
  if (selected.error && isSchemaMismatch(selected.error.message)) return null;

  const inserted = await supabase
    .from("roles")
    .insert({ name: ADMIN_ROLE, description: "System administrator role" })
    .select("id")
    .single();

  if (!inserted.error && inserted.data?.id) return inserted.data.id as string;
  if (inserted.error && isSchemaMismatch(inserted.error.message)) return null;
  throw new Error(inserted.error?.message ?? "Unable to ensure admin role id");
}

async function upsertUsersAdminRecord(supabase: SupabaseLike, params: { userId: string; email: string; name: string }) {
  const attempts: Array<{
    mode: InitializeAdminResult["usersWriteMode"];
    getRow: () => Promise<Record<string, unknown>>;
  }> = [
    {
      mode: "name_role",
      getRow: async () => ({ id: params.userId, email: params.email, name: params.name, role: ADMIN_ROLE }),
    },
    {
      mode: "full_name_role",
      getRow: async () => ({ id: params.userId, email: params.email, full_name: params.name, role: ADMIN_ROLE }),
    },
    {
      mode: "full_name_role_id",
      getRow: async () => {
        const roleId = await getAdminRoleId(supabase);
        if (!roleId) throw new Error("roles table is unavailable for role_id assignment");
        return { id: params.userId, email: params.email, full_name: params.name, role_id: roleId };
      },
    },
    {
      mode: "name_role_id",
      getRow: async () => {
        const roleId = await getAdminRoleId(supabase);
        if (!roleId) throw new Error("roles table is unavailable for role_id assignment");
        return { id: params.userId, email: params.email, name: params.name, role_id: roleId };
      },
    },
  ];

  const failures: string[] = [];

  for (const attempt of attempts) {
    try {
      const row = await attempt.getRow();
      const { error } = await supabase.from("users").upsert(row, { onConflict: "id" });
      if (!error) return attempt.mode;
      failures.push(`${attempt.mode}: ${error.message}`);
    } catch (error) {
      failures.push(`${attempt.mode}: ${(error as Error).message}`);
    }
  }

  throw new AdminInitializationError(
    "USERS_UPSERT_FAILED",
    `Unable to write admin role to public.users. ${failures.join(" | ")}`,
  );
}

async function upsertProfilesAdminRecord(supabase: SupabaseLike, params: { userId: string; email: string; name: string }) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: params.userId,
      email: params.email,
      full_name: params.name,
      role: ADMIN_ROLE,
    },
    { onConflict: "id" },
  );

  if (!error) return true;
  if (isSchemaMismatch(error.message)) return false;
  throw new Error(error.message);
}

export async function initializeAdmin(supabase: SupabaseLike, input: InitializeAdminInput): Promise<InitializeAdminResult> {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const name = input.name?.trim() || DEFAULT_ADMIN_NAME;

  if (!email || !password) {
    throw new AdminInitializationError("INVALID_INPUT", "Email and password are required");
  }

  const adminExists = await isAdminInitialized(supabase);
  if (adminExists) {
    throw new AdminInitializationError("ADMIN_ALREADY_INITIALIZED", "Admin already initialized");
  }

  const authResult = await createOrUpdateAuthAdminUser(supabase, { email, password, name });
  const usersWriteMode = await upsertUsersAdminRecord(supabase, {
    userId: authResult.user.id,
    email,
    name,
  });
  const profilesSynced = await upsertProfilesAdminRecord(supabase, {
    userId: authResult.user.id,
    email,
    name,
  });

  return {
    userId: authResult.user.id,
    email,
    createdAuthUser: authResult.created,
    usersWriteMode,
    profilesSynced,
  };
}
