"use client";

import { useEffect, useState } from "react";

interface TimelineEntry {
  title: string;
  area: string;
  emoji: string;
  date: string;
  sentiment: string | null;
  content: string;
  url: string;
}

function isNew(dateStr: string): boolean {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 24 * 60 * 60 * 1000; // 24시간
}

const AREA_EMOJI: Record<string, string> = {
  나: "🌱", 일: "💼", 관계: "🤝", 배움: "📚",
  건강: "🏃", 가족: "🏡", "경제적 자유": "💰", 이룸: "🏆",
};

const AREA_COLOR: Record<string, string> = {
  나: "border-green-500/50", 일: "border-blue-500/50", 관계: "border-pink-500/50",
  배움: "border-purple-500/50", 건강: "border-orange-500/50", 가족: "border-pink-300/50",
  "경제적 자유": "border-yellow-500/50", 이룸: "border-emerald-500/50",
};

const SENTIMENT_EMOJI: Record<string, string> = {
  긍정: "😊", 부정: "😔", 중립: "😐",
};

export default function RecentTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[] | null>(null);

  useEffect(() => {
    // 캐시 API 우선 시도, 실패 시 직접 Notion API
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
        <h2 className="text-base sm:text-lg font-bold mb-4">📝 최근 기록</h2>
        <div className="h-24 sm:h-32 bg-[#222] rounded"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6">
        <h2 className="text-lg font-bold mb-4">📝 최근 기록</h2>
        <p className="text-gray-500 text-sm">아직 기록이 없어요.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-bold">📝 최근 기록</h2>
        <span className="text-xs text-gray-500">전체 영역 최신순</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
        {entries.slice(0, 6).map((entry, i) => (
          <a
            key={`${entry.date}-${i}`}
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-xl bg-[#222] border-l-3 ${AREA_COLOR[entry.area] || "border-gray-500/50"} p-3 hover:bg-[#2a2a2a] transition group`}
            style={{ borderLeftWidth: "3px" }}
          >
            <div>
              <div className="flex-1 min-w-0">
                {/* 영역 + 제목 */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-[#1a1a1a] px-1.5 py-0.5 rounded text-gray-400 shrink-0">
                    {AREA_EMOJI[entry.area] || "📌"} {entry.area}
                  </span>
                  {entry.sentiment && (
                    <span className="text-[10px]">
                      {SENTIMENT_EMOJI[entry.sentiment] || ""}
                    </span>
                  )}
                  {isNew(entry.date) && (
                    <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition">
                  {entry.title}
                </h3>
                {entry.content && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {entry.content}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-gray-600 mt-1">
                {entry.date}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
