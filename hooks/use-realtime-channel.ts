"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useRealtimeChannel(channelName: string, onEvent: () => void) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        onEvent();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, onEvent]);
}
