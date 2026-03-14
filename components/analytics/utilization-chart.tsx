"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UtilizationChart({
  data,
}: {
  data: Array<{ day: string; utilization: number; turnaround: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>OR Utilization vs Turnaround</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="utilization" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="turnaround" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
