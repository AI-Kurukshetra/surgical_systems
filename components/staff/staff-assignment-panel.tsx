"use client";

import { useEffect, useState } from "react";
import { staffService } from "@/src/services";
import type { Staff } from "@/src/services/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StaffAssignmentPanel() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [surgeon, setSurgeon] = useState("");
  const [anesthesiologist, setAnesthesiologist] = useState("");

  useEffect(() => {
    const load = async () => {
      const result = await staffService.getAll();
      if (!result.error) {
        setStaff(result.data ?? []);
      }
    };

    void load();
  }, []);

  const surgeonCandidates = staff.filter((s) => (s.role ?? "").toLowerCase().includes("surgeon"));
  const anesCandidates = staff.filter((s) => (s.role ?? "").toLowerCase().includes("anesth"));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="mb-1 text-sm font-medium">Primary Surgeon</p>
          <Select value={surgeon || "none"} onValueChange={(v) => setSurgeon(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select surgeon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {surgeonCandidates.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name ?? item.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium">Anesthesiologist</p>
          <Select value={anesthesiologist || "none"} onValueChange={(v) => setAnesthesiologist(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select anesthesiologist" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {anesCandidates.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name ?? item.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
