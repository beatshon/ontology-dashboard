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
  fullDate: string;
  score: number;
  count: number;
  emotions: string[];
  label: string;
  emoji: string;
}

const LABEL_SCORE: Record<string, number> = {
  "긍정": 1,
  "중립": 0,
  "부정": -1,
};

const LABEL_EMOJI: Record<string, string> = {
  "긍정": "\uD83D\uDE0A",
  "중립": "\uD83D\uDE10",
  "부정": "\uD83D\uDE14",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EmojiDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload?.emoji) return null;
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      style={{ pointerEvents: "none" }}
    >
      {payload.emoji}
    </text>
  );
}

export default function SentimentChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-6">
        <h2 className="text-lg font-bold mb-4">감정 흐름</h2>
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
      fullDate: date,
      score: Math.round(avg * 10) / 10,
      count: d.scores.length,
      emotions: [...new Set(d.emotions)],
      label: majority,
      emoji: LABEL_EMOJI[majority] ?? "\uD83D\uDE10",
    };
  });

  // Summary stats
  const total = data.length;
  const positive = data.filter((d) => d.label === "긍정").length;
  const negative = data.filter((d) => d.label === "부정").length;
  const neutral = total - positive - negative;

  // Today's dominant emotion
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPoint = points.find((p) => p.fullDate === todayStr);
  const todayEmoji = todayPoint?.emoji ?? null;
  const todayLabel = todayPoint?.label ?? null;

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">감정 흐름</h2>
        {todayEmoji && (
          <div className="flex items-center gap-2 bg-[#222] rounded-xl px-3 py-1.5">
            <span className="text-2xl sentiment-badge-pulse">{todayEmoji}</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500">오늘</span>
              <span className="text-xs text-gray-300">{todayLabel}</span>
            </div>
          </div>
        )}
      </div>

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
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
              <stop offset="40%" stopColor="#a78bfa" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.3} />
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
              const emoji = value > 0 ? "\uD83D\uDE0A 긍정" : value < 0 ? "\uD83D\uDE14 부정" : "\uD83D\uDE10 중립";
              return [`${emoji} (${Math.abs(value).toFixed(1)})`, "감정"];
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#sentGrad)"
            dot={<EmojiDot />}
            activeDot={{ r: 6, fill: "#a78bfa", stroke: "#1a1a1a", strokeWidth: 2 }}
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
