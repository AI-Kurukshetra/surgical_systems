import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { PROTECTED_ROUTES, ROLE_ROUTE_ACCESS } from "@/lib/constants";
import { env } from "@/lib/env";
import type { UserRole } from "@/types/domain";

const AUTH_ROUTES = ["/login"];
type SupabaseCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.searchParams.delete("next");
    return NextResponse.redirect(redirectUrl);
  }

  // Enforce role-based route access (e.g. /settings and /admin are admin-only)
  if (user && isProtectedRoute) {
    const matchedRoute = Object.keys(ROLE_ROUTE_ACCESS)
      .filter((route) => pathname.startsWith(route))
      .sort((a, b) => b.length - a.length)[0];
    if (matchedRoute) {
      const allowedRoles = ROLE_ROUTE_ACCESS[matchedRoute] as UserRole[] | undefined;
      if (allowedRoles?.length) {
        let userRole: string | null = (user.app_metadata?.role as string) ?? (user.user_metadata?.role as string) ?? null;
        if (!userRole) {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
          userRole = (profile?.role as string) ?? null;
        }
        const normalizedRole = userRole?.toLowerCase().trim();
        const allowed = allowedRoles.some((r) => r.toLowerCase() === normalizedRole);
        if (!allowed) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/dashboard";
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
