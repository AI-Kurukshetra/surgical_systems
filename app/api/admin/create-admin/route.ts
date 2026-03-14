import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { AdminInitializationError, initializeAdmin } from "@/src/lib/adminInitialization";

type CreateAdminPayload = {
  email?: unknown;
  password?: unknown;
  name?: unknown;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  const payload = (await req.json().catch(() => null)) as CreateAdminPayload | null;

  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload?.password === "string" ? payload.password.trim() : "";
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";

  if (!email || !isValidEmail(email)) {
    return errorResponse("Valid admin email is required", 400, { code: "INVALID_EMAIL" });
  }

  if (!password || password.length < 6) {
    return errorResponse("Password must be at least 6 characters", 400, { code: "INVALID_PASSWORD" });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const result = await initializeAdmin(supabase, { email, password, name: name || undefined });

    return successResponse(
      {
        userId: result.userId,
        email: result.email,
        role: "admin",
        createdAuthUser: result.createdAuthUser,
      },
      201,
    );
  } catch (error) {
    if (error instanceof AdminInitializationError) {
      if (error.code === "ADMIN_ALREADY_INITIALIZED") {
        return errorResponse("Admin already initialized", 409, { code: error.code });
      }

      const status = error.code === "INVALID_INPUT" ? 400 : 500;
      return errorResponse(error.message, status, { code: error.code });
    }

    return errorResponse((error as Error).message || "Failed to initialize admin", 500, {
      code: "ADMIN_INITIALIZATION_FAILED",
    });
  }
}
