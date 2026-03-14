import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { forbiddenResponse, getSessionUserFromServer, isAdminRoleFromMetadata } from "@/src/lib/metadataRole";
import { getSupabaseServerClient } from "@/src/lib/supabaseServer";

type HospitalPayload = {
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
};

type HospitalRow = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
};

function sanitize(payload: Record<string, unknown>): HospitalPayload {
  const toNullable = (value: unknown) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  return {
    name: toNullable(payload.name),
    address: toNullable(payload.address),
    city: toNullable(payload.city),
    state: toNullable(payload.state),
    country: toNullable(payload.country),
    phone: toNullable(payload.phone),
    email: toNullable(payload.email),
  };
}

function isSchemaMismatch(message: string | undefined) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("column") ||
    normalized.includes("does not exist") ||
    normalized.includes("relation") ||
    normalized.includes("could not find")
  );
}

function isNoRowsError(message: string | undefined) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("pgrst116") ||
    normalized.includes("no rows") ||
    normalized.includes("0 rows")
  );
}

function mapHospitalRow(row: Record<string, unknown>): HospitalRow {
  return {
    id: (row.id as string) ?? "",
    name: (row.name as string | null | undefined) ?? null,
    address: (row.address as string | null | undefined) ?? null,
    city: (row.city as string | null | undefined) ?? null,
    state: (row.state as string | null | undefined) ?? null,
    country: (row.country as string | null | undefined) ?? null,
    phone: (row.phone as string | null | undefined) ?? null,
    email: (row.email as string | null | undefined) ?? null,
    created_at: (row.created_at as string | null | undefined) ?? new Date(0).toISOString(),
  };
}

async function getHospitalByIdWithFallback(supabase: ReturnType<typeof getSupabaseServerClient>, id: string) {
  const full = await supabase.from("hospitals").select("id,name,address,city,state,country,phone,email,created_at").eq("id", id).single();
  if (!full.error) return mapHospitalRow(full.data as Record<string, unknown>);
  if (!isSchemaMismatch(full.error.message)) throw new Error(full.error.message);

  const mid = await supabase.from("hospitals").select("id,name,address,phone,created_at").eq("id", id).single();
  if (!mid.error) return mapHospitalRow(mid.data as Record<string, unknown>);
  if (!isSchemaMismatch(mid.error.message)) throw new Error(mid.error.message);

  const minimal = await supabase.from("hospitals").select("id,name,created_at").eq("id", id).single();
  if (!minimal.error) return mapHospitalRow(minimal.data as Record<string, unknown>);

  throw new Error(minimal.error.message);
}

async function updateHospitalWithFallback(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  id: string,
  payload: HospitalPayload,
) {
  // Try full payload first (all columns from hospital_management migration)
  const first = await supabase
    .from("hospitals")
    .update(payload as never)
    .eq("id", id)
    .select("id,name,address,city,state,country,phone,email,created_at")
    .single();
  if (!first.error) return mapHospitalRow(first.data as Record<string, unknown>);
  if (isNoRowsError(first.error.message)) throw new Error("HOSPITAL_NOT_FOUND");
  if (!isSchemaMismatch(first.error.message)) throw new Error(first.error.message);

  // Fallback: table may not have city, state, country
  const secondPayload = {
    name: payload.name,
    address: payload.address,
    phone: payload.phone,
    email: payload.email,
  };
  const second = await supabase.from("hospitals").update(secondPayload as never).eq("id", id).select("*").single();
  if (!second.error) return mapHospitalRow(second.data as Record<string, unknown>);
  if (isNoRowsError(second.error.message)) throw new Error("HOSPITAL_NOT_FOUND");
  if (!isSchemaMismatch(second.error.message)) throw new Error(second.error.message);

  // Fallback: table may not have email (e.g. only name, address, phone)
  const thirdPayload = {
    name: payload.name,
    address: payload.address,
    phone: payload.phone,
  };
  const third = await supabase.from("hospitals").update(thirdPayload as never).eq("id", id).select("*").single();
  if (!third.error) return mapHospitalRow(third.data as Record<string, unknown>);
  if (isNoRowsError(third.error.message)) throw new Error("HOSPITAL_NOT_FOUND");
  if (!isSchemaMismatch(third.error.message)) throw new Error(third.error.message);

  // Minimal: name only
  const fourth = await supabase.from("hospitals").update({ name: payload.name } as never).eq("id", id).select("*").single();
  if (!fourth.error) return mapHospitalRow(fourth.data as Record<string, unknown>);
  if (isNoRowsError(fourth.error.message)) throw new Error("HOSPITAL_NOT_FOUND");

  throw new Error(fourth.error.message);
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { user } = await getSessionUserFromServer();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await context.params;
  try {
    const supabase = getSupabaseServerClient();
    const data = await getHospitalByIdWithFallback(supabase, id);
    return successResponse(data);
  } catch {
    return errorResponse("Unable to load hospitals. Please try again.", 404);
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { user } = await getSessionUserFromServer();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!isAdminRoleFromMetadata(user)) return forbiddenResponse();

  const { id } = await context.params;

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const payload = sanitize(raw as Record<string, unknown>);
  if (!payload.name) {
    return errorResponse("Hospital name is required", 400);
  }

  try {
    const adminSupabase = getSupabaseAdminClient();
    const data = await updateHospitalWithFallback(adminSupabase, id, payload);
    return successResponse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "HOSPITAL_NOT_FOUND") {
      return errorResponse("Hospital not found.", 404);
    }
    console.error("[api/hospitals][PUT] update failed", { id, message });
    return errorResponse("Unable to save hospital. Please try again.", 500, {
      code: message,
    });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { user } = await getSessionUserFromServer();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!isAdminRoleFromMetadata(user)) return forbiddenResponse();

  const { id } = await context.params;
  try {
    const adminSupabase = getSupabaseAdminClient();
    const { error } = await adminSupabase.from("hospitals").delete().eq("id", id);
    if (error) {
      return errorResponse("Unable to delete hospital. Please try again.", 500);
    }
  } catch {
    return errorResponse("Unable to delete hospital. Please try again.", 500);
  }
  return successResponse({ deleted: true });
}
