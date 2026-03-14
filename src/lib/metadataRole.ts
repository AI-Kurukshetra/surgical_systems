import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/src/lib/supabaseServer";

function normalizeRole(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export function getRoleFromMetadata(user: {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
}) {
  return normalizeRole(user.user_metadata?.role) ?? normalizeRole(user.app_metadata?.role);
}

export function isAdminRoleFromMetadata(user: {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
}) {
  return getRoleFromMetadata(user) === "admin";
}

export function forbiddenResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Forbidden",
    },
    { status: 403 },
  );
}

export async function getSessionUserFromServer() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      user: null,
      role: null,
    };
  }

  return {
    user: data.user,
    role: getRoleFromMetadata(data.user),
  };
}
