"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartDay {
  date: string;
  points: number;
  steps: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-purple-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-purple-600">
            {p.name === "points" ? "⚡" : "👟"} {p.value.toLocaleString()} {p.name}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function StatsChart({ userId }: { userId: string }) {
  const [data, setData] = useState<ChartDay[]>([]);
  const [view, setView] = useState<"points" | "steps">("points");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setData(d.chartData ?? []));
  }, [userId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">7-Day Activity</CardTitle>
          <div className="flex gap-1">
            {(["points", "steps"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  view === v
                    ? "bg-purple-600 text-white"
                    : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                }`}
              >
                {v === "points" ? "⚡ Points" : "👟 Steps"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={35} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3e8ff", radius: 8 }} />
            <Bar
              dataKey={view}
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
