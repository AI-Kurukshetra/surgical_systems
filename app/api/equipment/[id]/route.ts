import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

type EquipmentStatus = "available" | "in_use" | "maintenance";

function isValidStatus(status: unknown): status is EquipmentStatus {
  return status === "available" || status === "in_use" || status === "maintenance";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const { data, error } = await supabase.from("equipment").select("*").eq("id", params.id).single();
  if (error) return errorResponse(error.message, 404);
  return successResponse(data);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "staff"])) return errorResponse("Forbidden", 403);

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") return errorResponse("Invalid request body", 400);

  const status = (payload as Record<string, unknown>).status;
  if (status !== undefined && !isValidStatus(status)) {
    return errorResponse("Invalid status value", 400);
  }

  const { data, error } = await supabase.from("equipment").update(payload).eq("id", params.id).select("*").single();
  if (error) return errorResponse(error.message, 400);
  return successResponse(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler"])) return errorResponse("Forbidden", 403);

  const { error } = await supabase.from("equipment").delete().eq("id", params.id);
  if (error) return errorResponse(error.message, 400);
  return successResponse({ deleted: true });
}
