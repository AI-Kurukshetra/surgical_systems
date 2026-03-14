import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard } from "@/src/lib/roleGuard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendLoginCredentials } from "@/src/lib/sendStaffCredentials";
import { generateRandomPassword } from "@/src/lib/randomPassword";
import { createCrudHandlers } from "@/src/lib/crudRoute";

const STAFF_ROLE = "staff";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const crud = createCrudHandlers({
  table: "staff",
  readRoles: ["admin", "scheduler", "surgeon", "staff"],
  createRoles: ["admin", "scheduler"],
  updateRoles: ["admin", "scheduler"],
  deleteRoles: ["admin"],
  defaultOrderBy: { column: "created_at", ascending: false },
});

export const GET = crud.GET;
export const PUT = crud.PUT;
export const DELETE = crud.DELETE;

export async function POST(req: Request) {
  const auth = await getCurrentUserWithRole();
  if (!auth.user) return errorResponse("Unauthorized", 401);
  if (!roleGuard(auth.role, ["admin", "scheduler"])) return errorResponse("Forbidden", 403);

  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") return errorResponse("Invalid request body", 400);

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const hospital_id = typeof payload.hospital_id === "string" ? payload.hospital_id.trim() || null : null;

  if (!email || !isValidEmail(email)) {
    return errorResponse("Valid email is required", 400, { code: "INVALID_EMAIL" });
  }

  const password = generateRandomPassword(12);
  const supabaseAdmin = getSupabaseAdminClient();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name || email, role: STAFF_ROLE },
    app_metadata: { role: STAFF_ROLE },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already registered") || authError.message.toLowerCase().includes("already exists")) {
      return errorResponse("A staff account with this email already exists", 409, { code: "EMAIL_EXISTS" });
    }
    return errorResponse(authError.message, 400, { code: "AUTH_CREATE_FAILED" });
  }

  const userId = authData.user?.id;
  if (!userId) return errorResponse("Failed to create auth user", 500);

  const staffRow = {
    id: userId,
    name: name || null,
    email,
    role: STAFF_ROLE,
    hospital_id,
  };

  const { data: staff, error: insertError } = await supabaseAdmin
    .from("staff")
    .insert(staffRow)
    .select("*")
    .single();

  if (insertError) {
    return errorResponse(insertError.message, 400, { code: "STAFF_INSERT_FAILED" });
  }

  const sendResult = await sendLoginCredentials({
    to: email,
    name: name || "Staff",
    password,
    roleLabel: "Staff",
  });
  if (!sendResult.ok) {
    // Staff and auth user are already created; log and still return success
    // eslint-disable-next-line no-console
    console.warn("[staff POST] Failed to send credentials email:", sendResult.error);
  }

  return successResponse(staff, 201);
}
