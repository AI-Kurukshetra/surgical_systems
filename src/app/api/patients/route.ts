import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

type PatientPayload = {
  first_name?: string | null;
  last_name?: string | null;
  dob?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
};

function sanitizePayload(payload: Record<string, unknown>): PatientPayload {
  return {
    first_name: (payload.first_name as string | null | undefined) ?? null,
    last_name: (payload.last_name as string | null | undefined) ?? null,
    dob: (payload.dob as string | null | undefined) ?? null,
    gender: (payload.gender as string | null | undefined) ?? null,
    phone: (payload.phone as string | null | undefined) ?? null,
    email: (payload.email as string | null | undefined) ?? null,
  };
}

function getId(req: Request) {
  return new URL(req.url).searchParams.get("id");
}

export async function GET() {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
  if (error) return errorResponse(error.message, 400);

  return successResponse(data ?? []);
}

export async function POST(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);

  const { data, error } = await supabase.from("patients").insert(payload).select("*").single();
  if (error) return errorResponse(error.message, 400);

  return successResponse(data, 201);
}

export async function PUT(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const id = (raw as Record<string, unknown>).id as string | undefined;
  const queryId = getId(req);
  const patientId = id ?? queryId;

  if (!patientId) return errorResponse("id is required", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);

  const { data, error } = await supabase.from("patients").update(payload).eq("id", patientId).select("*").single();
  if (error) return errorResponse(error.message, 400);

  return successResponse(data);
}

export async function DELETE(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  const bodyId = raw && typeof raw === "object" ? ((raw as Record<string, unknown>).id as string | undefined) : undefined;
  const queryId = getId(req);
  const patientId = bodyId ?? queryId;

  if (!patientId) return errorResponse("id is required", 400);

  const { error } = await supabase.from("patients").delete().eq("id", patientId);
  if (error) return errorResponse(error.message, 400);

  return successResponse({ deleted: true });
}
