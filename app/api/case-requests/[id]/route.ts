import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

type CaseRequestStatus = "pending" | "approved" | "rejected";

function isValidStatus(status: unknown): status is CaseRequestStatus {
  return status === "pending" || status === "approved" || status === "rejected";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const { data, error } = await supabase.from("case_requests").select("*").eq("id", params.id).single();
  if (error) return errorResponse(error.message, 404);
  return successResponse(data);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler"])) return errorResponse("Forbidden", 403);

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") return errorResponse("Invalid request body", 400);

  if (role === "scheduler") {
    const status = (payload as Record<string, unknown>).status;
    if (!isValidStatus(status) || status === "pending") {
      return errorResponse("Scheduler can only set status to approved or rejected", 400);
    }
    const { data, error } = await supabase.from("case_requests").update({ status }).eq("id", params.id).select("*").single();
    if (error) return errorResponse(error.message, 400);
    return successResponse(data);
  }

  const { data, error } = await supabase.from("case_requests").update(payload).eq("id", params.id).select("*").single();
  if (error) return errorResponse(error.message, 400);
  return successResponse(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin"])) return errorResponse("Forbidden", 403);

  const { error } = await supabase.from("case_requests").delete().eq("id", params.id);
  if (error) return errorResponse(error.message, 400);
  return successResponse({ deleted: true });
}
