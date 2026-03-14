import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

type CaseRequestStatus = "pending" | "approved" | "rejected";

type CaseRequestPayload = {
  surgeon_id?: string | null;
  patient_id?: string | null;
  procedure_name?: string | null;
  requested_date?: string | null;
  status?: CaseRequestStatus;
};

function sanitizePayload(payload: Record<string, unknown>): CaseRequestPayload {
  return {
    surgeon_id: (payload.surgeon_id as string | null | undefined) ?? null,
    patient_id: (payload.patient_id as string | null | undefined) ?? null,
    procedure_name: (payload.procedure_name as string | null | undefined) ?? null,
    requested_date: (payload.requested_date as string | null | undefined) ?? null,
    status: (payload.status as CaseRequestStatus | undefined) ?? undefined,
  };
}

function getId(req: Request) {
  return new URL(req.url).searchParams.get("id");
}

function isValidStatus(status: unknown): status is CaseRequestStatus {
  return status === "pending" || status === "approved" || status === "rejected";
}

export async function GET() {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const { data, error } = await supabase.from("case_requests").select("*").order("requested_date", { ascending: false });
  if (error) return errorResponse(error.message, 400);

  const list = Array.isArray(data) ? data : [];
  return successResponse(list);
}

export async function POST(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();

  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "surgeon"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);

  if (!payload.surgeon_id || !payload.patient_id || !payload.procedure_name || !payload.requested_date) {
    return errorResponse("surgeon_id, patient_id, procedure_name, and requested_date are required", 400);
  }

  const insertPayload: CaseRequestPayload = {
    ...payload,
    status: "pending",
  };

  const { data, error } = await supabase.from("case_requests").insert(insertPayload).select("*").single();
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
  const requestId = id ?? queryId;
  if (!requestId) return errorResponse("id is required", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);

  // Scheduler can only approve/reject by status update.
  if (role === "scheduler") {
    if (!payload.status || !isValidStatus(payload.status) || payload.status === "pending") {
      return errorResponse("Scheduler can only set status to approved or rejected", 400);
    }

    const { data, error } = await supabase
      .from("case_requests")
      .update({ status: payload.status })
      .eq("id", requestId)
      .select("*")
      .single();

    if (error) return errorResponse(error.message, 400);
    return successResponse(data);
  }

  if (payload.status && !isValidStatus(payload.status)) {
    return errorResponse("Invalid status value", 400);
  }

  const updatePayload: Partial<CaseRequestPayload> = {};
  if (payload.status !== undefined) updatePayload.status = payload.status;
  if (payload.surgeon_id !== undefined && payload.surgeon_id !== null) updatePayload.surgeon_id = payload.surgeon_id;
  if (payload.patient_id !== undefined && payload.patient_id !== null) updatePayload.patient_id = payload.patient_id;
  if (payload.procedure_name !== undefined && payload.procedure_name !== null) updatePayload.procedure_name = payload.procedure_name;
  if (payload.requested_date !== undefined && payload.requested_date !== null) updatePayload.requested_date = payload.requested_date;

  const { data, error } = await supabase.from("case_requests").update(updatePayload).eq("id", requestId).select("*").single();
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
  const requestId = bodyId ?? queryId;

  if (!requestId) return errorResponse("id is required", 400);

  const { error } = await supabase.from("case_requests").delete().eq("id", requestId);
  if (error) return errorResponse(error.message, 400);

  return successResponse({ deleted: true });
}
