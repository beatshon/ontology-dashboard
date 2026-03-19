"use client";

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
}

interface Props {
  stats: { area: string; emoji: string; count: number; color: string }[];
}

export default function BalanceRadar({ stats }: Props) {
  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const fullMark = Math.ceil(maxCount * 1.2);

  const data: RadarItem[] = stats.map((s) => ({
    ...s,
    fullMark,
  }));

  const avg = stats.reduce((sum, s) => sum + s.count, 0) / stats.length;
  const variance =
    stats.reduce((sum, s) => sum + Math.pow(s.count - avg, 2), 0) /
    stats.length;
  const balance = Math.max(0, Math.round(100 - Math.sqrt(variance) * 5));

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
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

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="#2a2a2a" />
          <PolarAngleAxis
            dataKey="emoji"
            tick={{ fill: "#999", fontSize: 18 }}
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
                  <p style={{ color: d.color }}>{d.count}개 기록</p>
                </div>
              );
            }}
          />
          <Radar
            name="기록"
            dataKey="count"
            stroke="#60a5fa"
            fill="#60a5fa"
            fillOpacity={0.15}
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
