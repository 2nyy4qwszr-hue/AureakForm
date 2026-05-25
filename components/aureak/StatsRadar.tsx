"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import type { WellnessStats } from "./PlayerCard";

const KEYS: { key: keyof WellnessStats; label: string }[] = [
  { key: "forme",      label: "FOR" },
  { key: "sleep",      label: "SOM" },
  { key: "recovery",   label: "REC" },
  { key: "physical",   label: "PHY" },
  { key: "mental",     label: "MEN" },
  { key: "regularity", label: "REG" },
];

export function StatsRadar({ stats }: { stats: WellnessStats }) {
  const data = KEYS.map(({ key, label }) => ({
    axis: label,
    value: stats[key],
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="rgba(255,255,255,.1)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#8b93a7", fontSize: 11, fontFamily: "var(--font-oswald)" }}
        />
        <Radar
          name="stats"
          dataKey="value"
          stroke="#c9a44b"
          fill="#c9a44b"
          fillOpacity={0.35}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
