"use client";

import { useCallback, useEffect, useState } from "react";
import { ORStatusBoard, type ORDashboardRow } from "@/components/dashboard/or-status-board";
import { useRealtime } from "@/src/hooks/useRealtime";
import { caseRequestsService, operatingRoomsService, surgeonsService, surgeriesService } from "@/src/services";
import type { CaseRequest, OperatingRoom, Surgeon, Surgery } from "@/src/services/types";

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function pickCurrentSurgery(surgeries: Surgery[]) {
  const inProgress = surgeries
    .filter((s) => s.status === "in_progress")
    .sort((a, b) => (b.scheduled_start ?? "").localeCompare(a.scheduled_start ?? ""));

  if (inProgress.length > 0) return inProgress[0];

  const scheduled = surgeries
    .filter((s) => s.status === "scheduled")
    .sort((a, b) => (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? ""));

  return scheduled[0] ?? null;
}

export function ORDashboardLive() {
  const [rows, setRows] = useState<ORDashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    setError(null);

    const [roomsRes, surgeriesRes, requestsRes, surgeonsRes] = await Promise.all([
      operatingRoomsService.getAll(),
      surgeriesService.getAll(),
      caseRequestsService.getAll(),
      surgeonsService.getAll(),
    ]);

    if (roomsRes.error || surgeriesRes.error || requestsRes.error || surgeonsRes.error) {
      console.error("[ORDashboardLive] load failed", {
        roomsError: roomsRes.error,
        surgeriesError: surgeriesRes.error,
        requestsError: requestsRes.error,
        surgeonsError: surgeonsRes.error,
      });

      setError("Unable to load data. Please try again later.");
      setRows([]);
      setLoading(false);
      return;
    }

    const rooms = roomsRes.data ?? [];
    const surgeries = surgeriesRes.data ?? [];
    const requests = requestsRes.data ?? [];
    const surgeons = surgeonsRes.data ?? [];

    const requestsMap = new Map((requests as CaseRequest[]).map((request) => [request.id, request]));
    const surgeonsMap = new Map((surgeons as Surgeon[]).map((surgeon) => [surgeon.id, surgeon]));

    const tableRows = (rooms as OperatingRoom[]).map((room) => {
      const roomSurgeries = (surgeries as Surgery[]).filter((surgery) => surgery.operating_room_id === room.id);
      const currentSurgery = pickCurrentSurgery(roomSurgeries);

      if (!currentSurgery) {
        return {
          room_name: room.room_name ?? room.id,
          surgery: "No active surgery",
          surgeon: "-",
          status: room.status ?? "available",
          start_time: "-",
        } satisfies ORDashboardRow;
      }

      const caseRequest = currentSurgery.case_request_id ? requestsMap.get(currentSurgery.case_request_id) : null;
      // Prefer surgeon assigned on the surgery (scheduling), then fall back to case request's surgeon
      const surgeonId = currentSurgery.surgeon_id ?? caseRequest?.surgeon_id ?? null;
      const surgeon = surgeonId ? surgeonsMap.get(surgeonId) : null;

      return {
        room_name: room.room_name ?? room.id,
        surgery: caseRequest?.procedure_name ?? `Surgery ${currentSurgery.id.slice(0, 8)}`,
        surgeon: surgeon?.name ?? "Unassigned",
        status: room.status ?? "available",
        start_time: formatDateTime(currentSurgery.scheduled_start),
      } satisfies ORDashboardRow;
    });

    setRows(tableRows);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useRealtime({
    channel: "or-dashboard-live",
    tables: ["operating_rooms", "surgeries", "case_requests"],
    onChange: () => {
      void loadBoard();
    },
  });

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Realtime connected. Last updated: {lastUpdated ?? "--:--:--"}
      </p>
      {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
      {loading ? (
        <p className="rounded-md border bg-white p-4 text-sm text-muted-foreground">Loading OR dashboard...</p>
      ) : (
        <ORStatusBoard data={rows} />
      )}
    </div>
  );
}
