"use client";

import { useState, useEffect } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarItem {
  area: string;
  emoji: string;
  count: number;
  color: string;
  fullMark: number;
  pct: number;
}

interface Props {
  stats: { area: string; emoji: string; count: number; color: string }[];
}

export default function BalanceRadar({ stats }: Props) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const fullMark = Math.ceil(maxCount * 1.2);

  const data: RadarItem[] = stats.map((s) => ({
    ...s,
    fullMark,
    pct: Math.round((s.count / maxCount) * 100),
  }));

  const avg = stats.reduce((sum, s) => sum + s.count, 0) / stats.length;
  const variance =
    stats.reduce((sum, s) => sum + Math.pow(s.count - avg, 2), 0) /
    stats.length;
  const stdDev = Math.sqrt(variance);
  // Normalize: perfect balance = 100 (stdDev=0), worst = 0
  const coeffOfVariation = avg > 0 ? stdDev / avg : 1;
  const balance = Math.max(0, Math.round(100 * (1 - coeffOfVariation)));

  // Custom tick that shows emoji + percentage
  const renderPolarAngleAxis = (props: {
    payload: { value: string };
    x: number;
    y: number;
    cx: number;
    cy: number;
  }) => {
    const { payload, x, y, cx, cy } = props;
    const item = data.find((d) => d.emoji === payload.value);
    const pct = item?.pct ?? 0;
    const area = item?.area ?? "";

    // Offset text outward from center
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offsetFactor = 18 / (dist || 1);
    const ox = x + dx * offsetFactor;
    const oy = y + dy * offsetFactor;

    return (
      <g>
        <text
          x={ox}
          y={oy - 6}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 16 }}
        >
          {payload.value}
        </text>
        <text
          x={ox}
          y={oy + 10}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 9, fill: "#666" }}
        >
          {area} {pct}%
        </text>
      </g>
    );
  };

  return (
    <div
      className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 ${loaded ? "radar-loaded" : "radar-loading"}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest">
          삶의 균형
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#555]">밸런스</span>
          <span
            className="text-lg font-bold"
            style={{
              color:
                balance >= 70 ? "#4ade80" : balance >= 40 ? "#fbbf24" : "#f87171",
            }}
          >
            {balance}%
          </span>
        </div>
      </div>

      {/* Balance score bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#555]">균형 점수</span>
          <span
            className="text-xs font-bold"
            style={{
              color:
                balance >= 70 ? "#4ade80" : balance >= 40 ? "#fbbf24" : "#f87171",
            }}
          >
            {balance}/100
          </span>
        </div>
        <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: loaded ? `${balance}%` : "0%",
              background:
                balance >= 70
                  ? "linear-gradient(90deg, #4ade80, #22d3ee)"
                  : balance >= 40
                    ? "linear-gradient(90deg, #fbbf24, #fb923c)"
                    : "linear-gradient(90deg, #f87171, #ef4444)",
            }}
          />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
            </radialGradient>
          </defs>
          <PolarGrid stroke="#2a2a2a" />
          <PolarAngleAxis
            dataKey="emoji"
            tick={renderPolarAngleAxis}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, fullMark]}
            tick={{ fill: "#444", fontSize: 10 }}
            tickCount={4}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as RadarItem;
              return (
                <div className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm">
                  <p className="text-white font-medium">
                    {d.emoji} {d.area}
                  </p>
                  <p style={{ color: d.color }}>
                    {d.count}개 기록 ({d.pct}%)
                  </p>
                </div>
              );
            }}
          />
          <Radar
            name="기록"
            dataKey="count"
            stroke="#60a5fa"
            fill="url(#radarGradient)"
            fillOpacity={1}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-2 text-center">
        <p className="text-xs text-[#555]">
          {balance >= 70
            ? "고르게 잘 기록하고 있어요"
            : balance >= 40
              ? "일부 영역에 더 관심을 기울여보세요"
              : "특정 영역에 집중되어 있어요"}
        </p>
      </div>
    </div>
  );
}
