"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
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
import { DoorOpen, GripVertical, Scissors } from "lucide-react";

type RoomInfo = { id: string; label: string };

type CaseItem = {
  id: string;
  procedureName: string;
  timeStart: string;
  timeEnd: string;
  roomId: string;
};

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SurgeryCard({
  item,
  isOverlay,
}: {
  item: CaseItem;
  isOverlay?: boolean;
}) {
  return (
    <div
      className={
        isOverlay
          ? "cursor-grabbing rounded-lg border-2 border-primary/40 bg-card p-3 shadow-lg"
          : "cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
      }
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex shrink-0 text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Scissors className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium text-sm">{item.procedureName}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.timeStart} – {item.timeEnd}
          </p>
        </div>
      </div>
    </div>
  );
}

function DraggableCase({ item }: { item: CaseItem }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: item,
  });
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <SurgeryCard item={item} />
    </div>
  );
}

function DropZone({
  room,
  count,
  children,
  isOver,
}: {
  room: RoomInfo;
  count: number;
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: room.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[200px] flex-col rounded-xl border-2 transition-all duration-200 ${
        isOver
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border/80 bg-muted/30"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-2 rounded-t-[10px] border-b px-4 py-3 ${
          isOver ? "border-primary/30 bg-primary/10" : "border-border/60 bg-muted/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <DoorOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold text-foreground">{room.label}</span>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count} {count === 1 ? "surgery" : "surgeries"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        {isOver && (
          <p className="mb-2 rounded-md bg-primary/10 px-2 py-1.5 text-center text-xs font-medium text-primary">
            Drop here → assign to <strong>{room.label}</strong>
          </p>
        )}
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}

export function SurgerySchedulerCalendar() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const load = useCallback(async () => {
    const [surgeriesRes, roomsRes, requestsRes] = await Promise.all([
      surgeriesService.getAll(),
      operatingRoomsService.getAll(),
      caseRequestsService.getAll(),
    ]);

    if (surgeriesRes.error || roomsRes.error || requestsRes.error) {
      setError(
        surgeriesRes.error?.message ||
          roomsRes.error?.message ||
          requestsRes.error?.message ||
          "Failed to load schedule."
      );
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

  const roomNames = useMemo<RoomInfo[]>(
    () => rooms.map((room) => ({ id: room.id, label: room.room_name ?? room.id })),
    [rooms]
  );

  const cases = useMemo<CaseItem[]>(
    () =>
      surgeries
        .filter((s) => s.operating_room_id)
        .map((s) => {
          const req = s.case_request_id ? requestsMap.get(s.case_request_id) : undefined;
          const procedureName = req?.procedure_name ?? `Surgery ${s.id.slice(0, 8)}`;
          return {
            id: s.id,
            procedureName,
            timeStart: formatTime(s.scheduled_start),
            timeEnd: formatTime(s.scheduled_end),
            roomId: s.operating_room_id as string,
          };
        }),
    [surgeries, requestsMap]
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

  const casesById = useMemo(() => new Map(cases.map((c) => [c.id, c])), [cases]);
  const activeItem = activeId ? casesById.get(activeId) : null;
  const overRoom = overId ? roomNames.find((r) => r.id === overId) : null;

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const onDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string | null ?? null);
  }, []);

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);

      if (!over) return;

      const surgeryId = active.id.toString();
      const targetRoomId = over.id.toString();

      setSurgeries((prev) =>
        prev.map((s) =>
          s.id === surgeryId ? { ...s, operating_room_id: targetRoomId } : s
        )
      );

      const result = await surgeriesService.update(surgeryId, {
        operating_room_id: targetRoomId,
      });
      if (result.error) {
        setError(result.error.message);
      }
    },
    []
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/20">
        <CardTitle className="text-lg">Operating room assignment</CardTitle>
        <p className="text-sm text-muted-foreground">
          Each column is an operating room. Drag a surgery into a column to assign it to that room. While dragging, the target column will show where the surgery will move.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {error ? (
          <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={(e) => void onDragEnd(e)}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roomNames.map((room) => (
              <DropZone
                key={room.id}
                room={room}
                count={groupedCases[room.id]?.length ?? 0}
                isOver={overId === room.id}
              >
                {groupedCases[room.id]?.map((item) => (
                  <DraggableCase key={item.id} item={item} />
                ))}
              </DropZone>
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeItem ? (
              <div className="space-y-2">
                <SurgeryCard item={activeItem} isOverlay />
                {overRoom && (
                  <div className="rounded-md bg-primary/15 px-3 py-2 text-center text-sm font-medium text-primary">
                    Moving to: <strong>{overRoom.label}</strong>
                  </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
