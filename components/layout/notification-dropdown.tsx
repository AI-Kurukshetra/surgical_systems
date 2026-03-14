"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useRealtime } from "@/src/hooks/useRealtime";
import { notificationsService } from "@/src/services";
import type { Notification } from "@/src/services/types";
import { Button } from "@/components/ui/button";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadUnread = useCallback(async () => {
    const result = await notificationsService.getUnread();
    if (result.error) {
      setError(result.error.message);
      return;
    }

    setNotifications(result.data ?? []);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadUnread();
  }, [loadUnread]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  useRealtime({
    channel: "notifications-dropdown",
    tables: ["notifications"],
    onChange: () => {
      void loadUnread();
    },
  });

  const onMarkAsRead = async (id: string) => {
    const result = await notificationsService.markAsRead(id);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="relative rounded-md border bg-white p-2 text-slate-700 hover:bg-slate-50"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {notifications.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-xl border bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Unread Notifications</h3>
            <span className="text-xs text-muted-foreground">{notifications.length}</span>
          </div>

          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
          {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}

          {!loading && notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unread notifications.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-auto">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-md border p-2">
                  <p className="text-sm">{notification.message ?? "Notification"}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
                    <Button size="sm" variant="outline" onClick={() => void onMarkAsRead(notification.id)}>
                      Mark as read
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
