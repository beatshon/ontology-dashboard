"use client";

import type { AchievementTrend as TrendData } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface Props {
  data: TrendData[];
}

export default function AchievementTrendChart({ data }: Props) {
  if (data.length === 0 || data.every((d) => d.points === 0)) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-6">
        <h2 className="text-lg font-bold mb-4">🏆 이룸 포인트 트렌드</h2>
        <p className="text-gray-500 text-sm">아직 이룸 기록이 없어요.</p>
      </div>
    );
  }

  const totalPoints = data.reduce((s, d) => s + d.points, 0);
  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const best = data.reduce((max, d) => (d.points > max.points ? d : max), data[0]);

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-6">
      <h2 className="text-lg font-bold mb-1">🏆 이룸 포인트 트렌드</h2>

      {/* Summary */}
      <div className="flex gap-4 mb-4 text-xs text-gray-400">
        <span>
          총 <span className="text-amber-400 font-bold">{totalPoints}</span>점
        </span>
        <span>
          <span className="text-white font-bold">{totalCount}</span>건 달성
        </span>
        {best.points > 0 && (
          <span>
            최고 주: <span className="text-amber-400">{best.week}</span> ({best.points}점)
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="achieveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{ background: "#262626", border: "none", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#999" }}
            formatter={(value: number, name: string) => [
              `${value}${name === "points" ? "점" : "건"}`,
              name === "points" ? "포인트" : "달성 수",
            ]}
          />
          <Bar dataKey="points" fill="url(#achieveGrad)" radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#fb923c"
            strokeWidth={2}
            dot={{ r: 3, fill: "#fb923c" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
