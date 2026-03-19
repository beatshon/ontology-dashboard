"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StatItem {
  area: string;
  emoji: string;
  count: number;
  color: string;
}

interface Props {
  stats: StatItem[];
}

export default function StatsChart({ stats }: Props) {
  const total = stats.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest">
          영역별 기록
        </h2>
        <span className="text-2xl font-bold text-white">{total}개</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={stats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="emoji"
            tick={{ fill: "#666", fontSize: 18 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#555", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as StatItem;
              return (
                <div className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm">
                  <p className="text-white font-medium">{d.area}</p>
                  <p style={{ color: d.color }}>{d.count}개</p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {stats.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {stats.map((s) => (
          <div key={s.area} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[11px] text-[#666] truncate">{s.area.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
