"use client";

import type { SentimentRecord } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Props {
  data: SentimentRecord[];
}

interface DayPoint {
  date: string;
  score: number;
  count: number;
  emotions: string[];
  label: string;
}

const LABEL_SCORE: Record<string, number> = {
  "긍정": 1,
  "중립": 0,
  "부정": -1,
};

export default function SentimentChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-6">
        <h2 className="text-lg font-bold mb-4">😊 감정 흐름</h2>
        <p className="text-gray-500 text-sm">아직 감정 데이터가 없어요.</p>
      </div>
    );
  }

  // Group by date and calculate weighted score
  const dayMap = new Map<string, { scores: number[]; emotions: string[]; labels: string[] }>();
  for (const r of data) {
    const existing = dayMap.get(r.date) ?? { scores: [], emotions: [], labels: [] };
    const baseScore = LABEL_SCORE[r.label] ?? 0;
    existing.scores.push(baseScore * r.intensity);
    if (r.emotion) existing.emotions.push(r.emotion);
    existing.labels.push(r.label);
    dayMap.set(r.date, existing);
  }

  const points: DayPoint[] = Array.from(dayMap.entries()).map(([date, d]) => {
    const avg = d.scores.reduce((a, b) => a + b, 0) / d.scores.length;
    const majority = d.labels.sort(
      (a, b) => d.labels.filter((l) => l === b).length - d.labels.filter((l) => l === a).length
    )[0];
    return {
      date: date.slice(5), // MM-DD
      score: Math.round(avg * 10) / 10,
      count: d.scores.length,
      emotions: [...new Set(d.emotions)],
      label: majority,
    };
  });

  // Summary stats
  const total = data.length;
  const positive = data.filter((d) => d.label === "긍정").length;
  const negative = data.filter((d) => d.label === "부정").length;
  const neutral = total - positive - negative;

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-6">
      <h2 className="text-lg font-bold mb-2">😊 감정 흐름</h2>

      {/* Summary bar */}
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          긍정 {Math.round((positive / total) * 100)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
          중립 {Math.round((neutral / total) * 100)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-400" />
          부정 {Math.round((negative / total) * 100)}%
        </span>
        <span className="ml-auto">{total}건</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={points}>
          <defs>
            <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#6b7280" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[-5, 5]}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <ReferenceLine y={0} stroke="#333" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{ background: "#262626", border: "none", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#999" }}
            formatter={(value: number) => {
              const emoji = value > 0 ? "😊 긍정" : value < 0 ? "😔 부정" : "😐 중립";
              return [`${emoji} (${Math.abs(value).toFixed(1)})`, "감정"];
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#sentGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Top emotions */}
      {data.some((d) => d.emotion) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topEmotions(data).map(([emotion, count]) => (
            <span
              key={emotion}
              className="px-2 py-0.5 rounded-full text-xs bg-[#262626] text-gray-300"
            >
              {emotion} <span className="text-gray-500">({count})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function topEmotions(data: SentimentRecord[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const d of data) {
    if (d.emotion) {
      counts.set(d.emotion, (counts.get(d.emotion) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}
