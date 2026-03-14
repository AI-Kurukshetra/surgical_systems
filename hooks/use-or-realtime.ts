"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useORRealtime(onRefresh: () => void) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("or-live-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "operating_rooms" }, onRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "surgeries" }, onRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "case_requests" }, onRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "surgeons" }, onRefresh)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onRefresh]);
}
