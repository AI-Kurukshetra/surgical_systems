import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { errorResponse } from "@/src/lib/apiResponse";

export async function GET() {
  return withAuth(
    async ({ supabase }) => {
      const { data, error } = await supabase
        .from("analytics_metrics")
        .select("*")
        .order("measured_on", { ascending: false })
        .limit(120);

      if (error) return errorResponse(error.message, 400);
      return NextResponse.json(data ?? []);
    },
    { roles: ["admin", "scheduler"] },
  );
}
