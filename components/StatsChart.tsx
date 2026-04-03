"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LabelList,
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
  const [animate, setAnimate] = useState(true);
  const total = stats.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const topArea = stats.reduce(
    (top, s) => (s.count > top.count ? s : top),
    stats[0]
  );

  useEffect(() => {
    // Disable animation after initial render for rerenders
    const timer = setTimeout(() => setAnimate(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPercentLabel = (props: any) => {
    const { x = 0, y = 0, width = 0, value = 0 } = props;
    if (value === 0) return null;
    const pct = Math.round((Number(value) / total) * 100);
    return (
      <text
        x={Number(x) + Number(width) / 2}
        y={Number(y) - 6}
        fill="#888"
        textAnchor="middle"
        fontSize={10}
      >
        {pct}%
      </text>
    );
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest">
          영역별 기록
        </h2>
        <span className="text-2xl font-bold text-white counter-transition">
          {total}개
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={stats}
          margin={{ top: 16, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#1f1f1f"
            strokeDasharray="3 3"
            vertical={false}
          />
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
              const pct = Math.round((d.count / total) * 100);
              return (
                <div className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm">
                  <p className="text-white font-medium">{d.area}</p>
                  <p style={{ color: d.color }}>
                    {d.count}개 ({pct}%)
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            isAnimationActive={animate}
            animationDuration={800}
            animationEasing="ease-out"
            onClick={(data) => {
              if (data?.area) {
                window.location.href = `/area/${encodeURIComponent(data.area)}`;
              }
            }}
          >
            {stats.map((entry, i) => {
              const isTop = entry.area === topArea?.area;
              return (
                <Cell
                  key={i}
                  fill={entry.color}
                  fillOpacity={isTop ? 1 : 0.75}
                  style={
                    isTop
                      ? {
                          filter: `drop-shadow(0 0 6px ${entry.color}66)`,
                        }
                      : undefined
                  }
                />
              );
            })}
            <LabelList
              dataKey="count"
              content={renderPercentLabel}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {stats.map((s) => {
          const isTop = s.area === topArea?.area;
          return (
            <div key={s.area} className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${isTop ? "stats-glow-dot" : ""}`}
                style={{ backgroundColor: s.color }}
              />
              <span
                className={`text-[11px] truncate ${isTop ? "text-[#999] font-medium" : "text-[#666]"}`}
              >
                {s.area.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
