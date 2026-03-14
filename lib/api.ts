import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse } from "@/src/lib/apiResponse";
import type { UserRole } from "@/types/domain";
import { roleGuard } from "@/src/lib/roleGuard";

export async function withAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (ctx: { supabase: any; userId: string; role: UserRole | null }) => Promise<NextResponse>,
  options?: { roles?: UserRole[] },
) {
  const { user, role, supabase } = await getCurrentUserWithRole();
  if (!user) {
    return errorResponse("Authentication required", 401);
  }

  console.info("[withAuth] role check", { userId: user.id, role, path: "api" });

  if (options?.roles?.length) {
    if (!roleGuard(role, options.roles)) {
      return errorResponse("Access denied", 403);
    }
  }

  return handler({ supabase, userId: user.id, role: (role as UserRole | null) ?? null });
}
