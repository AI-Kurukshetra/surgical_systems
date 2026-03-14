import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const { data, error } = await supabase.from("staff").select("*").eq("id", params.id).single();
  if (error) return errorResponse(error.message, 404);
  return successResponse(data);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- id and created_at intentionally omitted from payload
  const { id: _id, created_at: _created_at, ...payload } = raw as Record<string, unknown>;

  const { data, error } = await supabase.from("staff").update(payload).eq("id", params.id).select("*").single();
  if (error) return errorResponse(error.message, 400);
  return successResponse(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin"])) return errorResponse("Forbidden", 403);

  const { error } = await supabase.from("staff").delete().eq("id", params.id);
  if (error) return errorResponse(error.message, 400);
  return successResponse({ deleted: true });
}
