"use client";

import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";

interface TimelineEntry {
  title: string;
  area: string;
  emoji: string;
  date: string;
  sentiment: string | null;
  content: string;
  url: string;
}

const AREA_EMOJI: Record<string, string> = {
  나: "\uD83C\uDF31", 일: "\uD83D\uDCBC", 관계: "\uD83E\uDD1D", 배움: "\uD83D\uDCDA",
  건강: "\uD83C\uDFC3", 가족: "\uD83C\uDFE1", "경제적 자유": "\uD83D\uDCB0", 이룸: "\uD83C\uDFC6",
};

const AREA_DOT_COLOR: Record<string, string> = {
  나: "#4ade80", 일: "#60a5fa", 관계: "#f472b6",
  배움: "#a78bfa", 건강: "#fb923c", 가족: "#f9a8d4",
  "경제적 자유": "#fbbf24", 이룸: "#34d399",
};

const AREA_BORDER_COLOR: Record<string, string> = {
  나: "border-green-500/50", 일: "border-blue-500/50", 관계: "border-pink-500/50",
  배움: "border-purple-500/50", 건강: "border-orange-500/50", 가족: "border-pink-300/50",
  "경제적 자유": "border-yellow-500/50", 이룸: "border-emerald-500/50",
};

const SENTIMENT_EMOJI: Record<string, string> = {
  긍정: "\uD83D\uDE0A", 부정: "\uD83D\uDE14", 중립: "\uD83D\uDE10",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "곧";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}주 전`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;

  return `${Math.floor(months / 12)}년 전`;
}

function isNew(dateStr: string): boolean {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 24 * 60 * 60 * 1000;
}

export default function RecentTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[] | null>(null);

  useEffect(() => {
    fetch("https://api.againline.kr/api/cache/timeline")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setEntries(d.entries || []))
      .catch(() => {
        fetch("/api/timeline")
          .then((r) => r.json())
          .then((d) => setEntries(d.entries || []))
          .catch(() => setEntries([]));
      });
  }, []);

  if (entries === null) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6 animate-pulse">
        <h2 className="text-base sm:text-lg font-bold mb-4">최근 기록</h2>
        <div className="h-24 sm:h-32 bg-[#222] rounded"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6">
        <h2 className="text-lg font-bold mb-4">최근 기록</h2>
        <EmptyState
          icon="📝"
          title="아직 기록이 없어요"
          description="오늘의 첫 기록을 남겨보세요. 작은 기록이 큰 변화를 만들어요."
        />
      </div>
    );
  }

  const displayEntries = entries.slice(0, 8);

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-bold">최근 기록</h2>
        <span className="text-xs text-gray-500">전체 영역 최신순</span>
      </div>

      <div className="relative max-h-[360px] overflow-y-auto pr-1">
        {/* Vertical timeline line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{ background: "linear-gradient(to bottom, #333, #1a1a1a)" }}
        />

        <div className="flex flex-col gap-1">
          {displayEntries.map((entry, i) => {
            const dotColor = AREA_DOT_COLOR[entry.area] ?? "#666";

            return (
              <a
                key={`${entry.date}-${i}`}
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex items-start gap-3 pl-6 py-2 rounded-lg hover:bg-[#222]/60 transition-colors duration-200 card-fade-in`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Timeline dot */}
                <div
                  className="absolute left-0 top-3.5 w-[14px] h-[14px] rounded-full border-2 flex-shrink-0 z-10"
                  style={{
                    borderColor: dotColor,
                    backgroundColor: isNew(entry.date) ? dotColor : "#1a1a1a",
                    boxShadow: isNew(entry.date) ? `0 0 6px ${dotColor}40` : "none",
                  }}
                >
                  {isNew(entry.date) && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ backgroundColor: dotColor, opacity: 0.3 }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Area + sentiment + relative time */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] bg-[#222] px-1.5 py-0.5 rounded text-gray-400 shrink-0">
                      {AREA_EMOJI[entry.area] || ""} {entry.area}
                    </span>
                    {entry.sentiment && (
                      <span className="text-[10px]">
                        {SENTIMENT_EMOJI[entry.sentiment] || ""}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600 ml-auto shrink-0">
                      {relativeTime(entry.date)}
                    </span>
                  </div>

                  <h3 className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                    {entry.title}
                  </h3>
                  {entry.content && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {entry.content}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
