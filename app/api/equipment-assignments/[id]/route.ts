import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { errorResponse } from "@/src/lib/apiResponse";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withAuth(async ({ supabase }) => {
    const { data, error } = await supabase.from("equipment_assignments").select("*").eq("id", params.id).single();
    if (error) return errorResponse(error.message, 404);
    return NextResponse.json(data);
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withAuth(async ({ supabase }) => {
    const payload = await req.json();
    const { data, error } = await supabase.from("equipment_assignments").update(payload).eq("id", params.id).select("*").single();
    if (error) return errorResponse(error.message, 400);
    return NextResponse.json(data);
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withAuth(async ({ supabase }) => {
    const { error } = await supabase.from("equipment_assignments").delete().eq("id", params.id);
    if (error) return errorResponse(error.message, 400);
    return NextResponse.json({ success: true });
  });
}
