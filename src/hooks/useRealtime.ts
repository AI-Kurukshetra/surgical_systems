"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RealtimeOptions = {
  channel: string;
  tables: string[];
  onChange: () => void;
};

export function useRealtime({ channel, tables, onChange }: RealtimeOptions) {
  useEffect(() => {
    if (!tables.length) return;

    const supabase = getSupabaseBrowserClient();
    let subscription = supabase.channel(channel);

    tables.forEach((table) => {
      subscription = subscription.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        onChange();
      });
    });

    const activeChannel = subscription.subscribe();

    return () => {
      void supabase.removeChannel(activeChannel);
    };
  }, [channel, onChange, tables]);
}
