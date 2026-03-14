import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

function getToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }
  return null;
}

export function getSupabaseRouteClient(req: Request) {
  const token = getToken(req);

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

export async function requireUser(req: Request) {
  const supabase = getSupabaseRouteClient(req);
  const token = getToken(req);
  const { data, error } = await supabase.auth.getUser(token ?? undefined);

  if (error || !data.user) {
    return { error: "Unauthorized", user: null, supabase };
  }

  return { error: null, user: data.user, supabase };
}
