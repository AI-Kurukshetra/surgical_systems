import type { AppRole } from "@/src/lib/roleGuard";
import { getSupabaseServerClient } from "@/src/lib/supabaseServer";

const VALID_ROLES: AppRole[] = ["admin", "scheduler", "surgeon", "staff"];

function normalizeRole(value: unknown): AppRole | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase().trim() as AppRole;
  return VALID_ROLES.includes(normalized) ? normalized : null;
}

type RoleProfile = { id: string; email: string | null; role: AppRole | null };

function getMetadataRole(user: {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
}) {
  return normalizeRole(user.user_metadata?.role) ?? normalizeRole(user.app_metadata?.role);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRoleFromProfiles(supabase: any, userId: string, fallbackEmail: string | null) {
  const { data, error } = await supabase.from("profiles").select("id,email,role").eq("id", userId).maybeSingle();

  if (error) {
    return { profile: null, role: null, error: error.message };
  }

  const row = data as { id: string; email?: string | null; role?: unknown } | null;
  if (!row) return { profile: null, role: null, error: null };

  const role = normalizeRole(row.role);
  const profile: RoleProfile = {
    id: row.id,
    email: row.email ?? fallbackEmail,
    role,
  };

  return { profile, role, error: null };
}

function extractRoleNameFromUsersJoin(value: unknown): AppRole | null {
  if (!value || typeof value !== "object") return null;

  const asObject = value as { name?: unknown };
  if (asObject.name) return normalizeRole(asObject.name);

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as { name?: unknown };
    return normalizeRole(first?.name);
  }

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRoleFromUsers(supabase: any, userId: string, fallbackEmail: string | null) {
  const directRole = await supabase.from("users").select("id,email,role").eq("id", userId).maybeSingle();
  if (!directRole.error && directRole.data) {
    const row = directRole.data as { id: string; email?: string | null; role?: unknown };
    const role = normalizeRole(row.role);
    const profile: RoleProfile = {
      id: row.id,
      email: row.email ?? fallbackEmail,
      role,
    };
    return { profile, role, error: null };
  }

  const joinedRole = await supabase.from("users").select("id,email,roles(name)").eq("id", userId).maybeSingle();
  if (!joinedRole.error && joinedRole.data) {
    const row = joinedRole.data as { id: string; email?: string | null; roles?: unknown };
    const role = extractRoleNameFromUsersJoin(row.roles);
    const profile: RoleProfile = {
      id: row.id,
      email: row.email ?? fallbackEmail,
      role,
    };
    return { profile, role, error: null };
  }

  return {
    profile: null,
    role: null,
    error: directRole.error?.message ?? joinedRole.error?.message ?? null,
  };
}

export type SessionContext = {
  user: { id: string; email?: string | null } | null;
  role: AppRole | null;
  profile: { id: string; email: string | null; role: AppRole | null } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
};

export async function getCurrentUserWithRole(): Promise<SessionContext> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    console.info("[auth] getUser failed", {
      userId: null,
      role: null,
      error: error?.message ?? "No active user",
    });
    return { user: null, role: null, profile: null, supabase };
  }

  const fallbackEmail = data.user.email ?? null;
  const metadataRole = getMetadataRole(data.user);
  const profileLookup = await getRoleFromProfiles(supabase, data.user.id, fallbackEmail);
  const usersLookup = await getRoleFromUsers(supabase, data.user.id, fallbackEmail);

  const resolvedRole = usersLookup.role ?? profileLookup.role ?? metadataRole ?? null;
  const profile = profileLookup.profile ?? usersLookup.profile;

  console.info("[auth] role resolution", {
    userId: data.user.id,
    metadataRole,
    profileError: profileLookup.error,
    profileRole: profileLookup.role,
    usersError: usersLookup.error,
    usersRole: usersLookup.role,
    resolvedRole,
  });

  return {
    user: { id: data.user.id, email: data.user.email },
    role: resolvedRole,
    profile,
    supabase,
  };
}

export async function getUserFromSession(): Promise<SessionContext> {
  return getCurrentUserWithRole();
}

export async function getCurrentUser() {
  const { user, role, profile, supabase } = await getCurrentUserWithRole();

  if (!user) {
    return {
      user: null,
      profile: null,
      role: null,
      supabase,
    };
  }

  const { data: profileDetails } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,hospital_id,created_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profileDetails ?? profile,
    role,
    supabase,
  };
}
