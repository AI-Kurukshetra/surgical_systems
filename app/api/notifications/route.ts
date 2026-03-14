import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";

type NotificationPayload = {
  user_id?: string | null;
  message?: string | null;
  is_read?: boolean;
};

function sanitizePayload(payload: Record<string, unknown>): NotificationPayload {
  return {
    user_id: (payload.user_id as string | null | undefined) ?? undefined,
    message: (payload.message as string | null | undefined) ?? undefined,
    is_read: (payload.is_read as boolean | undefined) ?? undefined,
  };
}

function getId(req: Request) {
  return new URL(req.url).searchParams.get("id");
}

export async function GET() {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("created_at", { ascending: false });

  if (error) return errorResponse(error.message, 400);
  return successResponse(data ?? []);
}

export async function POST(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);
  if (!payload.message?.trim()) return errorResponse("message is required", 400);

  const insertPayload: NotificationPayload = {
    user_id: payload.user_id ?? user.id,
    message: payload.message.trim(),
    is_read: payload.is_read ?? false,
  };

  const { data, error } = await supabase.from("notifications").insert(insertPayload).select("*").single();
  if (error) return errorResponse(error.message, 400);
  return successResponse(data, 201);
}

export async function PUT(req: Request) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(role, ["admin", "scheduler", "surgeon", "staff"])) return errorResponse("Forbidden", 403);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") return errorResponse("Invalid request body", 400);

  const id = (raw as Record<string, unknown>).id as string | undefined;
  const queryId = getId(req);
  const notificationId = id ?? queryId;
  if (!notificationId) return errorResponse("id is required", 400);

  const payload = sanitizePayload(raw as Record<string, unknown>);
  const updatePayload: NotificationPayload = {};

  if (payload.message !== undefined) updatePayload.message = payload.message;
  if (payload.is_read !== undefined) updatePayload.is_read = payload.is_read;
  if (payload.user_id !== undefined && role === "admin") updatePayload.user_id = payload.user_id;

  if (Object.keys(updatePayload).length === 0) {
    return errorResponse("No valid fields to update", 400);
  }

  const query = supabase.from("notifications").update(updatePayload).eq("id", notificationId);
  const restrictedQuery = role === "admin" ? query : query.eq("user_id", user.id);
  const { data, error } = await restrictedQuery.select("*").single();

  if (error) return errorResponse(error.message, 400);
  return successResponse(data);
}
