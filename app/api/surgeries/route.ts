import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

type SurgeryStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

type SurgeryPayload = {
  case_request_id?: string | null;
  operating_room_id?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  status?: SurgeryStatus;
};

function isValidStatus(status: unknown): status is SurgeryStatus {
  return status === "scheduled" || status === "in_progress" || status === "completed" || status === "cancelled";
}

function sanitizePayload(payload: Record<string, unknown>): SurgeryPayload {
  const status = payload.status as SurgeryStatus | undefined;

  return {
    case_request_id: (payload.case_request_id as string | null | undefined) ?? null,
    operating_room_id: (payload.operating_room_id as string | null | undefined) ?? null,
    scheduled_start: (payload.scheduled_start as string | null | undefined) ?? null,
    scheduled_end: (payload.scheduled_end as string | null | undefined) ?? null,
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

  const { data, error } = await supabase.from("surgeries").select("*").order("scheduled_start", { ascending: true });
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

  if (!payload.scheduled_start || !payload.scheduled_end) {
    return errorResponse("scheduled_start and scheduled_end are required", 400);
  }

  if (payload.status && !isValidStatus(payload.status)) {
    return errorResponse("Invalid status value", 400);
  }

  const insertPayload: SurgeryPayload = {
    ...payload,
    status: payload.status ?? "scheduled",
  };

  const { data, error } = await supabase.from("surgeries").insert(insertPayload).select("*").single();
  if (error) return errorResponse(error.message, 400);

  return successResponse(data, 201);
}

export async function PUT(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "staff"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const id = (raw as Record<string, unknown>).id as string | undefined;
  const queryId = getId(req);
  const surgeryId = id ?? queryId;

  if (!surgeryId) return errorResponse("id is required", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);

  if (role === "staff") {
    if (!payload.status || !isValidStatus(payload.status)) {
      return errorResponse("Staff can only update surgery status", 400);
    }

    const { data, error } = await supabase
      .from("surgeries")
      .update({ status: payload.status })
      .eq("id", surgeryId)
      .select("*")
      .single();

    if (error) return errorResponse(error.message, 400);
    return successResponse(data);
  }

  if (payload.status && !isValidStatus(payload.status)) {
    return errorResponse("Invalid status value", 400);
  }

  const { data, error } = await supabase.from("surgeries").update(payload).eq("id", surgeryId).select("*").single();
  if (error) return errorResponse(error.message, 400);

  return successResponse(data);
}

export async function DELETE(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  const bodyId = raw && typeof raw === "object" ? ((raw as Record<string, unknown>).id as string | undefined) : undefined;
  const queryId = getId(req);
  const surgeryId = bodyId ?? queryId;

  if (!surgeryId) return errorResponse("id is required", 400);

  const { error } = await supabase.from("surgeries").delete().eq("id", surgeryId);
  if (error) return errorResponse(error.message, 400);

  return successResponse({ deleted: true });
}
