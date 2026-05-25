"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Point = { date: string; value: number };

export function EvolutionChart({
  data,
  color = "#c9a44b",
  label = "OVR",
}: {
  data: Point[];
  color?: string;
  label?: string;
}) {
  const formatted = data.map((p) => ({
    ...p,
    day: new Date(p.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="rgba(255,255,255,.06)" />
        <XAxis
          dataKey="day"
          tick={{ fill: "#8b93a7", fontSize: 10 }}
          axisLine={{ stroke: "rgba(255,255,255,.08)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#8b93a7", fontSize: 10 }}
          axisLine={{ stroke: "rgba(255,255,255,.08)" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#131826",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#8b93a7" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          name={label}
          stroke={color}
          strokeWidth={3}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
