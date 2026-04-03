"use client";

import type { AreaData } from "@/types";

interface Milestone {
  emoji: string;
  title: string;
  description: string;
  threshold: number;
  check: (total: number, streak: number, areasCovered: number) => boolean;
  progress: (total: number, streak: number, areasCovered: number) => number;
}

const MILESTONES: Milestone[] = [
  {
    emoji: "🌱",
    title: "첫 기록 달성",
    description: "첫 번째 기록을 남겼어요",
    threshold: 1,
    check: (total) => total >= 1,
    progress: (total) => Math.min(total / 1, 1),
  },
  {
    emoji: "🔥",
    title: "7일 연속",
    description: "일주일 연속으로 기록했어요",
    threshold: 7,
    check: (_, streak) => streak >= 7,
    progress: (_, streak) => Math.min(streak / 7, 1),
  },
  {
    emoji: "⚡",
    title: "30일 연속",
    description: "한 달 연속 기록 달성!",
    threshold: 30,
    check: (_, streak) => streak >= 30,
    progress: (_, streak) => Math.min(streak / 30, 1),
  },
  {
    emoji: "💎",
    title: "100개 기록",
    description: "기록이 100개를 넘었어요",
    threshold: 100,
    check: (total) => total >= 100,
    progress: (total) => Math.min(total / 100, 1),
  },
  {
    emoji: "🏆",
    title: "500개 기록",
    description: "500개의 기록, 대단해요!",
    threshold: 500,
    check: (total) => total >= 500,
    progress: (total) => Math.min(total / 500, 1),
  },
  {
    emoji: "🌈",
    title: "7개 영역 모두 기록",
    description: "모든 삶의 영역에 기록했어요",
    threshold: 7,
    check: (_, __, areasCovered) => areasCovered >= 7,
    progress: (_, __, areasCovered) => Math.min(areasCovered / 7, 1),
  },
];

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

interface Props {
  areasData: AreaData[];
}

export default function MilestoneTracker({ areasData }: Props) {
  const totalRecords = areasData.reduce((sum, d) => sum + d.total, 0);
  const streak = calculateStreak(areasData);
  const areasCovered = areasData.filter((d) => d.total > 0).length;

  // Find next unearned milestone for progress display
  const firstUnearned = MILESTONES.find(
    (m) => !m.check(totalRecords, streak, areasCovered),
  );

  const earnedCount = MILESTONES.filter(
    (m) => m.check(totalRecords, streak, areasCovered),
  ).length;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#1a1a1a] border border-[#2a2a2a] p-5 sm:p-6 mb-4 sm:mb-6 milestone-enter">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h3 className="text-xs font-semibold text-[#888] uppercase tracking-widest">
            마일스톤 트래커
          </h3>
        </div>
        <span className="text-xs text-gray-500">
          {earnedCount}/{MILESTONES.length} 달성
        </span>
      </div>

      {/* Milestone badges grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        {MILESTONES.map((milestone) => {
          const earned = milestone.check(totalRecords, streak, areasCovered);
          const progress = milestone.progress(totalRecords, streak, areasCovered);
          const pct = Math.round(progress * 100);

          return (
            <div
              key={milestone.title}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-300 ${
                earned
                  ? "bg-white/8 border-white/15 milestone-earned"
                  : "bg-white/2 border-white/5 opacity-50"
              }`}
            >
              <span className={`text-2xl ${earned ? "" : "grayscale"}`}>
                {milestone.emoji}
              </span>
              <span
                className={`text-[10px] font-medium text-center leading-tight ${
                  earned ? "text-white" : "text-gray-600"
                }`}
              >
                {milestone.title}
              </span>

              {/* Progress bar for unearned */}
              {!earned && (
                <div className="w-full mt-1">
                  <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
                      }}
                    />
                  </div>
                  <span className="text-[8px] text-gray-600 mt-0.5 block text-center">
                    {pct}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next milestone progress */}
      {firstUnearned && (
        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-gray-500">
              다음 목표: {firstUnearned.emoji} {firstUnearned.title}
            </p>
            <span className="text-[10px] text-gray-500">
              {Math.round(firstUnearned.progress(totalRecords, streak, areasCovered) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 milestone-progress-bar"
              style={{
                width: `${Math.round(firstUnearned.progress(totalRecords, streak, areasCovered) * 100)}%`,
                background: "linear-gradient(90deg, #a78bfa, #4ade80)",
              }}
            />
          </div>
          <p className="text-[10px] text-gray-600 mt-1">{firstUnearned.description}</p>
        </div>
      )}
    </div>
  );
}
