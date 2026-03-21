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
import { AREAS } from "@/lib/areas";
import type { WeeklyCount } from "@/lib/notion";

interface Props {
  data: WeeklyCount[];
}

export default function TrendChart({ data }: Props) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest mb-6">
        주간 기록 트렌드
      </h2>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            tick={{ fill: "#555", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#444", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#222",
              border: "1px solid #333",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#999" }}
          />
          {AREAS.map((area) => (
            <Line
              key={area.key}
              type="monotone"
              dataKey={area.key}
              stroke={area.color}
              strokeWidth={2}
              dot={false}
              name={`${area.emoji} ${area.key}`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {AREAS.map((a) => (
          <div key={a.key} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: a.color }}
            />
            <span className="text-[11px] text-[#666] truncate">
              {a.emoji} {a.key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
