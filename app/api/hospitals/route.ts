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

async function listHospitalsWithFallback(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const full = await supabase
    .from("hospitals")
    .select("id,name,address,city,state,country,phone,email,created_at")
    .order("name", { ascending: true });
  if (!full.error) {
    return (full.data ?? []).map((row) => mapHospitalRow(row as Record<string, unknown>));
  }
  if (!isSchemaMismatch(full.error.message)) {
    throw new Error(full.error.message);
  }

  const mid = await supabase.from("hospitals").select("id,name,address,phone,created_at").order("name", { ascending: true });
  if (!mid.error) {
    return (mid.data ?? []).map((row) => mapHospitalRow(row as Record<string, unknown>));
  }
  if (!isSchemaMismatch(mid.error.message)) {
    throw new Error(mid.error.message);
  }

  const minimal = await supabase.from("hospitals").select("id,name,created_at").order("name", { ascending: true });
  if (!minimal.error) {
    return (minimal.data ?? []).map((row) => mapHospitalRow(row as Record<string, unknown>));
  }

  throw new Error(minimal.error.message);
}

function getCodeFromName(name: string) {
  const alnum = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = alnum.slice(0, 6) || "HOSP";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

async function insertHospitalWithFallback(supabase: ReturnType<typeof getSupabaseAdminClient>, payload: HospitalPayload) {
  const generatedCode = getCodeFromName(payload.name ?? "hospital");
  const attempts: Record<string, unknown>[] = [
    payload,
    { ...payload, code: generatedCode },
    {
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
    },
    {
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
      code: generatedCode,
    },
    {
      name: payload.name,
      code: generatedCode,
    },
    {
      name: payload.name,
    },
  ];

  let lastErrorMessage = "Unable to save hospital. Please try again.";

  for (const attempt of attempts) {
    const inserted = await supabase.from("hospitals").insert(attempt as never).select("*").single();
    if (!inserted.error) {
      return mapHospitalRow(inserted.data as Record<string, unknown>);
    }

    lastErrorMessage = inserted.error.message;
  }

  throw new Error(lastErrorMessage);
}

export async function GET() {
  const { user } = await getSessionUserFromServer();
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const supabase = getSupabaseServerClient();
    const data = await listHospitalsWithFallback(supabase);
    return successResponse(data ?? []);
  } catch {
    return errorResponse("Unable to load hospitals. Please try again.", 500);
  }
}

export async function POST(req: Request) {
  const { user } = await getSessionUserFromServer();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!isAdminRoleFromMetadata(user)) return forbiddenResponse();

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const payload = sanitize(raw as Record<string, unknown>);
  if (!payload.name) {
    return errorResponse("Hospital name is required", 400);
  }

  try {
    const adminSupabase = getSupabaseAdminClient();
    const data = await insertHospitalWithFallback(adminSupabase, payload);
    return successResponse(data, 201);
  } catch (error) {
    console.error("[api/hospitals][POST] create failed", {
      message: (error as Error).message,
    });
    return errorResponse("Unable to save hospital. Please try again.", 500);
  }
}
