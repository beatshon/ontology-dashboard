"use client";

import type { AreaData } from "@/types";

interface Props {
  areasData: AreaData[];
}

interface AreaWeeklyStats {
  area: string;
  emoji: string;
  color: string;
  thisWeek: number;
  lastWeek: number;
}

export default function WeeklyInsight({ areasData }: Props) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Calculate week boundaries
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - mondayOffset);
  const thisWeekStartStr = thisWeekStart.toISOString().slice(0, 10);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);

  const weeklyStats: AreaWeeklyStats[] = areasData.map((d) => {
    const thisWeek = d.records.filter((r) => {
      const date = (r.date || r.createdAt).slice(0, 10);
      return date >= thisWeekStartStr && date <= todayStr;
    }).length;

    const lastWeek = d.records.filter((r) => {
      const date = (r.date || r.createdAt).slice(0, 10);
      return date >= lastWeekStartStr && date < thisWeekStartStr;
    }).length;

    return {
      area: d.area.key,
      emoji: d.area.emoji,
      color: d.area.color,
      thisWeek,
      lastWeek,
    };
  });

  // Sort by this week's count
  const sorted = [...weeklyStats].sort((a, b) => b.thisWeek - a.thisWeek);
  const top = sorted[0];

  if (!top || top.thisWeek === 0) return null;

  const diff = top.thisWeek - top.lastWeek;
  const diffText =
    diff > 0
      ? `지난주 대비 +${diff}건 증가`
      : diff < 0
        ? `지난주 대비 ${diff}건 감소`
        : "지난주와 동일";
  const diffEmoji = diff > 0 ? "📈" : diff < 0 ? "📉" : "➡️";

  // Top 3 active areas
  const top3 = sorted.filter((s) => s.thisWeek > 0).slice(0, 3);

  const totalThisWeek = weeklyStats.reduce((s, w) => s + w.thisWeek, 0);
  const totalLastWeek = weeklyStats.reduce((s, w) => s + w.lastWeek, 0);
  const totalDiff = totalThisWeek - totalLastWeek;

  return (
    <div className="weekly-insight-enter">
      <div className="toss-card relative overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${top.color}60 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10">
          <h3 className="text-xs font-semibold text-[#888] uppercase tracking-widest mb-4">
            이번 주 인사이트
          </h3>

          {/* Most active area */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{top.emoji}</span>
            <div>
              <p className="text-sm text-white">
                가장 활발한 영역:{" "}
                <span className="font-bold" style={{ color: top.color }}>
                  {top.area}
                </span>
              </p>
              <span className="text-xl font-black" style={{ color: top.color }}>
                {top.thisWeek}
              </span>
              <span className="text-xs text-gray-500 ml-1">건</span>
            </div>
          </div>

          {/* Week comparison */}
          <p className="text-xs text-gray-400 ml-10 mb-4">
            {diffText} {diffEmoji}
          </p>

          {/* Top 3 areas bar */}
          <div className="flex gap-2 flex-wrap">
            {top3.map((s) => {
              const areaTotal = totalThisWeek || 1;
              const pct = Math.round((s.thisWeek / areaTotal) * 100);
              return (
                <div
                  key={s.area}
                  className="flex items-center gap-1.5 bg-white/5 rounded-xl px-3 py-2 border border-white/5"
                >
                  <span className="text-sm">{s.emoji}</span>
                  <span className="text-xs text-gray-300">{s.area}</span>
                  <span
                    className="text-[10px] font-bold ml-1"
                    style={{ color: s.color }}
                  >
                    {s.thisWeek}건
                  </span>
                  <span className="text-[10px] text-gray-500">({pct}%)</span>
                </div>
              );
            })}
          </div>

          {/* Total summary */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
            <span className="text-[10px] text-gray-500">
              이번 주 총 {totalThisWeek}건
            </span>
            {totalDiff !== 0 && (
              <span
                className="text-[10px] font-medium"
                style={{ color: totalDiff > 0 ? "#4ade80" : "#f87171" }}
              >
                {totalDiff > 0 ? "+" : ""}
                {totalDiff} vs 지난주
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
