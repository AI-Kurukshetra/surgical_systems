"use client";

import { useEffect, useMemo, useState } from "react";
import { equipmentService } from "@/src/services";
import type { Equipment } from "@/src/services/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatStatus } from "@/lib/utils";

export function EquipmentSelector() {
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const result = await equipmentService.getAll();
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setEquipment(result.data ?? []);
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return equipment;
    return equipment.filter((item) => (item.name ?? "").toLowerCase().includes(q));
  }, [equipment, query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Selector</CardTitle>
      </CardHeader>
      <CardContent>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search equipment" />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <div className="mt-3 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No equipment found.</p>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="rounded-md border p-2 text-sm">
                {item.name ?? "Unknown"} {item.status ? `(${formatStatus(item.status)})` : ""}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
