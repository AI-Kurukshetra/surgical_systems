import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

type OperatingRoomStatus = "available" | "in_surgery" | "cleaning" | "maintenance";

type OperatingRoomPayload = {
  hospital_id?: string | null;
  room_name?: string | null;
  status?: OperatingRoomStatus;
};

function isValidStatus(status: unknown): status is OperatingRoomStatus {
  return status === "available" || status === "in_surgery" || status === "cleaning" || status === "maintenance";
}

function sanitizePayload(payload: Record<string, unknown>): OperatingRoomPayload {
  const status = payload.status as OperatingRoomStatus | undefined;

  return {
    hospital_id: (payload.hospital_id as string | null | undefined) ?? null,
    room_name: (payload.room_name as string | null | undefined) ?? null,
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

  const { data, error } = await supabase.from("operating_rooms").select("*").order("room_name", { ascending: true });
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

  if (!payload.hospital_id || !payload.room_name) {
    return errorResponse("hospital_id and room_name are required", 400);
  }

  if (payload.status && !isValidStatus(payload.status)) {
    return errorResponse("Invalid status value", 400);
  }

  const insertPayload: OperatingRoomPayload = {
    ...payload,
    status: payload.status ?? "available",
  };

  const { data, error } = await supabase.from("operating_rooms").insert(insertPayload).select("*").single();
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
  const roomId = id ?? queryId;

  if (!roomId) return errorResponse("id is required", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);
  if (payload.status && !isValidStatus(payload.status)) {
    return errorResponse("Invalid status value", 400);
  }

  const { data, error } = await supabase.from("operating_rooms").update(payload).eq("id", roomId).select("*").single();
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
  const roomId = bodyId ?? queryId;

  if (!roomId) return errorResponse("id is required", 400);

  const { error } = await supabase.from("operating_rooms").delete().eq("id", roomId);
  if (error) return errorResponse(error.message, 400);

  return successResponse({ deleted: true });
}
