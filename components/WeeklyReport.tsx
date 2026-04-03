"use client";

import type { AreaData, SentimentRecord } from "@/types";

interface Props {
  areasData: AreaData[];
  sentimentData: SentimentRecord[] | null;
}

function calculateStreak(areasData: AreaData[]): number {
  const dateSets = new Set<string>();
  for (const d of areasData) {
    for (const r of d.records) {
      const date = (r.date || r.createdAt).slice(0, 10);
      dateSets.add(date);
    }
  }

  let streak = 0;
  const current = new Date();
  while (dateSets.has(current.toISOString().slice(0, 10))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}

function generateSummary(
  totalThisWeek: number,
  mostActive: string | null,
  streak: number,
): string {
  if (totalThisWeek === 0) return "이번 주 첫 기록을 시작해보세요!";
  if (streak >= 7) return `${streak}일 연속 기록 중! 꾸준함이 빛나는 한 주예요.`;
  if (totalThisWeek >= 20) return "기록이 풍성한 한 주! 다양한 영역에서 활발했어요.";
  if (totalThisWeek >= 10) return `${mostActive || "여러 영역"}에 집중한 한 주였어요.`;
  return "차분하게 기록을 이어가고 있어요.";
}

export default function WeeklyReport({ areasData, sentimentData }: Props) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Week boundaries (Monday-based)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - mondayOffset);
  const thisWeekStartStr = thisWeekStart.toISOString().slice(0, 10);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);

  // This week / last week counts per area
  const areaStats = areasData.map((d) => {
    const thisWeek = d.records.filter((r) => {
      const date = (r.date || r.createdAt).slice(0, 10);
      return date >= thisWeekStartStr && date <= todayStr;
    }).length;

    const lastWeek = d.records.filter((r) => {
      const date = (r.date || r.createdAt).slice(0, 10);
      return date >= lastWeekStartStr && date < thisWeekStartStr;
    }).length;

    return { area: d.area.key, emoji: d.area.emoji, color: d.area.color, thisWeek, lastWeek };
  });

  const totalThisWeek = areaStats.reduce((s, a) => s + a.thisWeek, 0);
  const totalLastWeek = areaStats.reduce((s, a) => s + a.lastWeek, 0);
  const totalDiff = totalThisWeek - totalLastWeek;

  const sorted = [...areaStats].sort((a, b) => b.thisWeek - a.thisWeek);
  const mostActive = sorted[0]?.thisWeek > 0 ? sorted[0] : null;
  const leastActive = [...sorted].reverse().find((a) => a.thisWeek >= 0) ?? null;

  // Sentiment keywords for this week
  const weekSentiments = (sentimentData ?? []).filter(
    (s) => s.date >= thisWeekStartStr && s.date <= todayStr,
  );
  const emotionCounts = new Map<string, number>();
  for (const s of weekSentiments) {
    if (s.emotion) {
      emotionCounts.set(s.emotion, (emotionCounts.get(s.emotion) ?? 0) + 1);
    }
  }
  const topEmotions = Array.from(emotionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const streak = calculateStreak(areasData);
  const summary = generateSummary(totalThisWeek, mostActive?.area ?? null, streak);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#1a1a1a] border border-[#2a2a2a] p-5 sm:p-6 mb-4 sm:mb-6 weekly-report-enter">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📋</span>
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-widest">
          주간 리포트 카드
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Total records */}
        <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
          <p className="text-[10px] text-gray-500 mb-1">이번 주 총 기록</p>
          <p className="text-lg font-bold text-white">
            {totalThisWeek}<span className="text-xs text-gray-400 ml-0.5">건</span>
          </p>
          {totalDiff !== 0 && (
            <p
              className="text-[10px] font-medium mt-0.5"
              style={{ color: totalDiff > 0 ? "#4ade80" : "#f87171" }}
            >
              지난주 대비 {totalDiff > 0 ? "+" : ""}{totalDiff}
            </p>
          )}
        </div>

        {/* Most active area */}
        <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
          <p className="text-[10px] text-gray-500 mb-1">가장 활발한 영역</p>
          {mostActive ? (
            <p className="text-sm font-bold" style={{ color: mostActive.color }}>
              {mostActive.emoji} {mostActive.area}
              <span className="text-xs text-gray-400 ml-1">({mostActive.thisWeek}건)</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">-</p>
          )}
        </div>

        {/* Least active area */}
        <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
          <p className="text-[10px] text-gray-500 mb-1">가장 조용한 영역</p>
          {leastActive ? (
            <p className="text-sm font-medium text-gray-400">
              {leastActive.emoji} {leastActive.area}
              <span className="text-xs text-gray-500 ml-1">({leastActive.thisWeek}건)</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">-</p>
          )}
        </div>

        {/* Streak */}
        <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
          <p className="text-[10px] text-gray-500 mb-1">연속 기록 일수</p>
          <p className="text-lg font-bold text-orange-400">
            {streak}<span className="text-xs text-gray-400 ml-0.5">일</span>
          </p>
        </div>
      </div>

      {/* Emotion keywords */}
      {topEmotions.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-gray-500">감정 키워드 Top 3:</span>
          {topEmotions.map(([emotion, count]) => (
            <span
              key={emotion}
              className="px-2 py-0.5 rounded-full text-xs bg-[#262626] text-gray-300 border border-white/5"
            >
              {emotion} <span className="text-gray-500">({count})</span>
            </span>
          ))}
        </div>
      )}

      {/* AI-style summary */}
      <div className="pt-3 border-t border-white/5">
        <p className="text-[10px] text-gray-500 mb-1">이번 주 한 줄 평</p>
        <p className="text-sm text-gray-300 italic">&ldquo;{summary}&rdquo;</p>
      </div>
    </div>
  );
}
