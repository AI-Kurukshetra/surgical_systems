import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

type EquipmentStatus = "available" | "in_use" | "maintenance";

type EquipmentPayload = {
  name?: string | null;
  hospital_id?: string | null;
  status?: EquipmentStatus;
};

function isValidStatus(status: unknown): status is EquipmentStatus {
  return status === "available" || status === "in_use" || status === "maintenance";
}

function sanitizePayload(payload: Record<string, unknown>): EquipmentPayload {
  const status = payload.status as EquipmentStatus | undefined;

  return {
    name: (payload.name as string | null | undefined) ?? null,
    hospital_id: (payload.hospital_id as string | null | undefined) ?? null,
    status: status && isValidStatus(status) ? status : undefined,
  };
}

function getId(req: Request) {
  return new URL(req.url).searchParams.get("id");
}

export async function GET() {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const { data, error } = await supabase.from("equipment").select("*").order("name", { ascending: true });
  if (error) return errorResponse(error.message, 400);

  return successResponse(data ?? []);
}

export async function POST(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "staff"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);
  if (!payload.name) return errorResponse("name is required", 400);
  if (payload.status && !isValidStatus(payload.status)) return errorResponse("Invalid status value", 400);

  const insertPayload: EquipmentPayload = {
    ...payload,
    status: payload.status ?? "available",
  };

  const { data, error } = await supabase.from("equipment").insert(insertPayload).select("*").single();
  if (error) return errorResponse(error.message, 400);

  return successResponse(data, 201);
}

export async function PUT(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "staff"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const id = (raw as Record<string, unknown>).id as string | undefined;
  const queryId = getId(req);
  const equipmentId = id ?? queryId;

  if (!equipmentId) return errorResponse("id is required", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);
  if (payload.status && !isValidStatus(payload.status)) return errorResponse("Invalid status value", 400);

  const { data, error } = await supabase.from("equipment").update(payload).eq("id", equipmentId).select("*").single();
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
  const equipmentId = bodyId ?? queryId;

  if (!equipmentId) return errorResponse("id is required", 400);

  const { error } = await supabase.from("equipment").delete().eq("id", equipmentId);
  if (error) return errorResponse(error.message, 400);

  return successResponse({ deleted: true });
}
