import { getCurrentUserWithRole } from "@/src/lib/auth";
import { errorResponse, successResponse } from "@/src/lib/apiResponse";
import { roleGuard, type AppRole } from "@/src/lib/roleGuard";

type CrudConfig = {
  table: string;
  readRoles: AppRole[];
  createRoles: AppRole[];
  updateRoles: AppRole[];
  deleteRoles: AppRole[];
  defaultOrderBy?: { column: string; ascending?: boolean };
};

function getIdFromUrl(req: Request) {
  return new URL(req.url).searchParams.get("id");
}

async function safeJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = (await req.json()) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

async function authorize(allowedRoles: AppRole[]) {
  const context = await getCurrentUserWithRole();
  if (!context.user) {
    return { ok: false as const, response: errorResponse("Unauthorized", 401) };
  }

  if (!roleGuard(context.role, allowedRoles)) {
    return { ok: false as const, response: errorResponse("Forbidden", 403) };
  }

  return { ok: true as const, context };
}

export function createCrudHandlers(config: CrudConfig) {
  const GET = async () => {
    const auth = await authorize(config.readRoles);
    if (!auth.ok) return auth.response;

    let query = auth.context.supabase.from(config.table).select("*");
    if (config.defaultOrderBy) {
      query = query.order(config.defaultOrderBy.column, {
        ascending: config.defaultOrderBy.ascending ?? true,
      });
    }

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 400);
    return successResponse(data ?? []);
  };

  const POST = async (req: Request) => {
    const auth = await authorize(config.createRoles);
    if (!auth.ok) return auth.response;

    const payload = await safeJson(req);
    if (!payload) return errorResponse("Invalid request body", 400);

    const { data, error } = await auth.context.supabase
      .from(config.table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(payload as any)
      .select("*")
      .single();
    if (error) return errorResponse(error.message, 400);
    return successResponse(data, 201);
  };

  const PUT = async (req: Request) => {
    const auth = await authorize(config.updateRoles);
    if (!auth.ok) return auth.response;

    const payload = await safeJson(req);
    if (!payload) return errorResponse("Invalid request body", 400);

    const id = (payload.id as string | undefined) ?? getIdFromUrl(req);
    if (!id) return errorResponse("id is required for update", 400);

    const updatePayload = { ...payload };
    delete updatePayload.id;

    const { data, error } = await auth.context.supabase
      .from(config.table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(updatePayload as any)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return errorResponse(error.message, 400);
    return successResponse(data);
  };

  const DELETE = async (req: Request) => {
    const auth = await authorize(config.deleteRoles);
    if (!auth.ok) return auth.response;

    const payload = await safeJson(req);
    const id = (payload?.id as string | undefined) ?? getIdFromUrl(req);
    if (!id) return errorResponse("id is required for delete", 400);

    const { error } = await auth.context.supabase.from(config.table).delete().eq("id", id);
    if (error) return errorResponse(error.message, 400);

    return successResponse({ deleted: true });
  };

  return { GET, POST, PUT, DELETE };
}
