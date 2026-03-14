import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") return errorResponse("Invalid request body", 400);

  const query = supabase.from("notifications").update(payload).eq("id", params.id);
  const restrictedQuery = role === "admin" ? query : query.eq("user_id", user.id);
  const { data, error } = await restrictedQuery.select("*").single();

  if (error) return errorResponse(error.message, 400);
  return successResponse(data);
}
