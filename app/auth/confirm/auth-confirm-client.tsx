"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Parse hash fragment into key-value map (Supabase puts tokens in hash by default).
 */
function parseHashParams(): Record<string, string> {
  if (typeof window === "undefined" || !window.location.hash) return {};
  const params: Record<string, string> = {};
  const hash = window.location.hash.substring(1);
  new URLSearchParams(hash).forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/**
 * Handles auth callback from Supabase email links (e.g. password reset).
 * By default Supabase sends tokens in the URL hash (not query), which the server never sees.
 * This client component reads hash or query params and establishes the session, then redirects.
 */
export function AuthConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"confirming" | "error">("confirming");

  useEffect(() => {
    const next = searchParams.get("next") ?? "/reset-password";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/reset-password";

    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;

      // 1) Tokens in query (custom email template): verify OTP via client
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash });
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace(safeNext);
        return;
      }

      // 2) Tokens in hash (default Supabase behavior): parse hash and set session
      const hashParams = parseHashParams();
      const access_token = hashParams.access_token;
      const refresh_token = hashParams.refresh_token;

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        // Clear hash from URL then redirect
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        router.replace(safeNext);
        return;
      }

      // 3) Let Supabase client try to recover from URL (e.g. if it already ran)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(safeNext);
        return;
      }

      setStatus("error");
      router.replace("/login?error=Reset link expired or invalid. Please request a new one.");
    };

    run();
  }, [router, searchParams]);

  if (status === "error") {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <p className="text-muted-foreground">Confirming…</p>
    </div>
  );
}
