"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { caseRequestsService, operatingRoomsService, surgeriesService } from "@/src/services";
import { useRealtime } from "@/src/hooks/useRealtime";
import type { CaseRequest, OperatingRoom, Surgery } from "@/src/services/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CaseItem = {
  id: string;
  title: string;
  roomId: string;
};

function DraggableCase({ item }: { item: CaseItem }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: item.id, data: item });
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab rounded-md border bg-white p-2 text-sm">
      {item.title}
    </div>
  );
}

function DropZone({ roomId, children }: { roomId: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: roomId });
  return (
    <div ref={setNodeRef} className={`rounded-lg border p-3 ${isOver ? "bg-accent" : "bg-muted/40"}`}>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{roomId}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function SurgerySchedulerCalendar() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const load = useCallback(async () => {
    const [surgeriesRes, roomsRes, requestsRes] = await Promise.all([
      surgeriesService.getAll(),
      operatingRoomsService.getAll(),
      caseRequestsService.getAll(),
    ]);

    if (surgeriesRes.error || roomsRes.error || requestsRes.error) {
      setError(surgeriesRes.error?.message || roomsRes.error?.message || requestsRes.error?.message || "Failed to load schedule.");
      return;
    }

    setSurgeries(surgeriesRes.data ?? []);
    setRooms(roomsRes.data ?? []);
    setRequests(requestsRes.data ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtime({
    channel: "scheduler-live",
    tables: ["surgeries", "case_requests", "operating_rooms"],
    onChange: () => {
      void load();
    },
  });

  const requestsMap = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);

  const roomNames = useMemo(
    () => rooms.map((room) => ({ id: room.id, label: room.room_name ?? room.id })),
    [rooms],
  );

  const cases = useMemo<CaseItem[]>(
    () =>
      surgeries
        .filter((s) => s.operating_room_id)
        .map((s) => {
          const req = s.case_request_id ? requestsMap.get(s.case_request_id) : undefined;
          const label = req?.procedure_name ?? `Surgery ${s.id.slice(0, 8)}`;
          const time = s.scheduled_start ? new Date(s.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
          return { id: s.id, title: `${label} - ${time}`, roomId: s.operating_room_id as string };
        }),
    [surgeries, requestsMap],
  );

  const groupedCases = useMemo(() => {
    const initial = roomNames.reduce<Record<string, CaseItem[]>>((acc, room) => {
      acc[room.id] = [];
      return acc;
    }, {});

    cases.forEach((item) => {
      if (initial[item.roomId]) {
        initial[item.roomId].push(item);
      }
    });

    return initial;
  }, [cases, roomNames]);

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const surgeryId = active.id.toString();
    const targetRoomId = over.id.toString();

    setSurgeries((prev) => prev.map((s) => (s.id === surgeryId ? { ...s, operating_room_id: targetRoomId } : s)));

    const result = await surgeriesService.update(surgeryId, { operating_room_id: targetRoomId });
    if (result.error) {
      setError(result.error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Surgery Scheduler (Drag and Drop)</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        <DndContext sensors={sensors} onDragEnd={(event) => void onDragEnd(event)}>
          <div className="grid gap-3 md:grid-cols-3">
            {roomNames.map((room) => (
              <DropZone key={room.id} roomId={room.id}>
                {groupedCases[room.id]?.map((item) => (
                  <DraggableCase key={item.id} item={item} />
                ))}
              </DropZone>
            ))}
          </div>
        </DndContext>
      </CardContent>
    </Card>
  );
}
