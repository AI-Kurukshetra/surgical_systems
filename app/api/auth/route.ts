import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse } from "@/src/lib/apiResponse";

export async function GET() {
  const { user, profile, role } = await getCurrentUserWithRole();

  if (!user) {
    return errorResponse("Authentication required", 401);
  }

  return NextResponse.json({
    success: true,
    data: {
      user,
      profile,
      role,
    },
  });
}
