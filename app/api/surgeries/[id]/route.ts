import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

type SurgeryStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

function isValidStatus(status: unknown): status is SurgeryStatus {
  return status === "scheduled" || status === "in_progress" || status === "completed" || status === "cancelled";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const { data, error } = await supabase.from("surgeries").select("*").eq("id", params.id).single();
  if (error) return errorResponse(error.message, 404);
  return successResponse(data);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "staff"])) return errorResponse("Forbidden", 403);

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") return errorResponse("Invalid request body", 400);

  if (role === "staff") {
    const status = (payload as Record<string, unknown>).status;
    if (!isValidStatus(status)) return errorResponse("Staff can only update surgery status", 400);
    const { data, error } = await supabase.from("surgeries").update({ status }).eq("id", params.id).select("*").single();
    if (error) return errorResponse(error.message, 400);
    return successResponse(data);
  }

  const body = payload as Record<string, unknown>;
  const allowedKeys = [
    "case_request_id",
    "patient_id",
    "surgeon_id",
    "operating_room_id",
    "scheduled_start",
    "scheduled_end",
    "status",
  ] as const;
  const surgeryUpdate: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const value = body[key];
    if (key === "status" && !isValidStatus(value)) continue;
    surgeryUpdate[key] = value === "" ? null : value;
  }

  const { data, error } = await supabase.from("surgeries").update(surgeryUpdate).eq("id", params.id).select("*").single();
  if (error) return errorResponse(error.message, 400);
  return successResponse(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler"])) return errorResponse("Forbidden", 403);

  const { error } = await supabase.from("surgeries").delete().eq("id", params.id);
  if (error) return errorResponse(error.message, 400);
  return successResponse({ deleted: true });
}
