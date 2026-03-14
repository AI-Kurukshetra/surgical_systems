"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { operatingRoomsService, surgeriesService } from "@/src/services";
import type { OperatingRoom, Surgery } from "@/src/services/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function isSameDay(date: Date, target: Date) {
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function durationMinutes(surgery: Surgery) {
  if (!surgery.scheduled_start || !surgery.scheduled_end) return 0;
  const start = new Date(surgery.scheduled_start).getTime();
  const end = new Date(surgery.scheduled_end).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round((end - start) / 60000);
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AnalyticsDashboard() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const [surgeriesRes, roomsRes] = await Promise.all([surgeriesService.getAll(), operatingRoomsService.getAll()]);

      if (surgeriesRes.error || roomsRes.error) {
        setError(surgeriesRes.error?.message || roomsRes.error?.message || "Failed to load analytics data.");
        setLoading(false);
        return;
      }

      setSurgeries(surgeriesRes.data ?? []);
      setRooms(roomsRes.data ?? []);
      setLoading(false);
    };

    void load();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const todaysSurgeries = surgeries.filter((surgery) => {
      if (!surgery.scheduled_start) return false;
      return isSameDay(new Date(surgery.scheduled_start), now);
    });

    const totalSurgeriesToday = todaysSurgeries.length;

    const totalMinutesToday = todaysSurgeries.reduce((sum, surgery) => sum + durationMinutes(surgery), 0);
    const avgDuration = totalSurgeriesToday > 0 ? Math.round(totalMinutesToday / totalSurgeriesToday) : 0;

    const totalRoomMinutes = Math.max(rooms.length, 1) * 24 * 60;
    const utilization = Math.min(100, Math.round((totalMinutesToday / totalRoomMinutes) * 100));

    const completedToday = todaysSurgeries.filter((surgery) => surgery.status === "completed").length;
    const cancelledToday = todaysSurgeries.filter((surgery) => surgery.status === "cancelled").length;

    return {
      totalSurgeriesToday,
      utilization,
      avgDuration,
      completedToday,
      cancelledToday,
    };
  }, [surgeries, rooms]);

  const weeklyVolumeData = useMemo(() => {
    const now = new Date();
    const days: Array<{ key: string; label: string; total: number }> = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      days.push({ key: dayKey(d), label, total: 0 });
    }

    const indexByDay = new Map(days.map((d, idx) => [d.key, idx]));

    surgeries.forEach((surgery) => {
      if (!surgery.scheduled_start) return;
      const date = new Date(surgery.scheduled_start);
      const key = dayKey(date);
      const index = indexByDay.get(key);
      if (index !== undefined) {
        days[index].total += 1;
      }
    });

    return days.map((d) => ({ day: d.label, surgeries: d.total }));
  }, [surgeries]);

  const completionData = useMemo(
    () => [
      { name: "Completed", value: metrics.completedToday, color: "#10b981" },
      { name: "Cancelled", value: metrics.cancelledToday, color: "#ef4444" },
    ],
    [metrics.completedToday, metrics.cancelledToday],
  );

  if (loading) {
    return <p className="rounded-md border bg-white p-4 text-sm text-muted-foreground">Loading analytics...</p>;
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Surgeries Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.totalSurgeriesToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Operating Room Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.utilization}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Average Surgery Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.avgDuration} mins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed vs Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.completedToday} / {metrics.cancelledToday}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Surgeries (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="surgeries" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed vs Cancelled (Today)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={completionData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>
                  {completionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
