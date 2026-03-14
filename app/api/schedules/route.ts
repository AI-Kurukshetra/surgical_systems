import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { errorResponse } from "@/src/lib/apiResponse";

export async function GET() {
  return withAuth(async ({ supabase }) => {
    const { data, error } = await supabase.from("schedules").select("*").order("scheduled_date", { ascending: true });
    if (error) return errorResponse(error.message, 400);
    return NextResponse.json(data ?? []);
  });
}

export async function POST(req: Request) {
  return withAuth(async ({ supabase }) => {
    const payload = await req.json();
    const { data, error } = await supabase.from("schedules").insert(payload).select("*").single();
    if (error) return errorResponse(error.message, 400);
    return NextResponse.json(data, { status: 201 });
  });
}
