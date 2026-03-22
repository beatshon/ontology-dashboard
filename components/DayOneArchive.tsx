"use client";

import { useEffect, useState } from "react";

interface DayOneEntry {
  title: string;
  area: string;
  date: string;
  sentiment: string | null;
  content: string;
  url: string;
  location: string | null;
  photoUrl: string | null;
}

const SENTIMENT_EMOJI: Record<string, string> = {
  "긍정": "😊",
  "부정": "😔",
  "중립": "😐",
};

const AREA_EMOJI: Record<string, string> = {
  "나": "🌱",
  "일": "💼",
  "관계": "🤝",
  "배움": "📚",
  "건강": "🏃",
  "가족": "🏡",
  "경제적 자유": "💰",
};

export default function DayOneArchive() {
  const [entries, setEntries] = useState<DayOneEntry[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // 캐시 API 우선, 실패 시 직접 Notion API
    fetch("https://api.againline.kr/api/cache/dayone")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setEntries(d.entries || []))
      .catch(() => {
        fetch("/api/dayone")
          .then((r) => r.json())
          .then((d) => setEntries(d.entries || []))
          .catch(() => setEntries([]));
      });
  }, []);

  if (entries === null) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6">
        <h2 className="text-lg font-bold mb-4">📔 Day One 일기</h2>
        <p className="text-gray-500 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (entries.length === 0) return null;

  const withPhoto = entries.filter((e) => e.photoUrl);
  const displayed = showAll ? entries : entries.slice(0, 1);

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-bold">📔 Day One 일기</h2>
        <span className="text-xs text-gray-500">
          {entries.length}개 · 사진 {withPhoto.length}장
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">최신순</p>

      <div className="space-y-3">
        {displayed.map((entry, i) => (
          <a
            key={`${entry.title}-${i}`}
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group rounded-xl bg-[#222] border border-gray-800/40 overflow-hidden hover:bg-[#2a2a2a] hover:border-gray-600/50 transition"
          >
            {entry.photoUrl && (
              <div className="w-full h-40 overflow-hidden bg-[#1a1a1a]">
                <img
                  src={entry.photoUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}

            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-gray-600">{entry.date}</span>
                <span className="text-[10px] text-gray-600">
                  {AREA_EMOJI[entry.area] || "📝"} {entry.area}
                </span>
                {entry.sentiment && (
                  <span className="text-[10px]">
                    {SENTIMENT_EMOJI[entry.sentiment] || ""}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-medium text-gray-200 mb-1">
                {entry.title}
              </h3>

              {entry.content && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {entry.content}
                </p>
              )}

              {entry.location && (
                <span className="text-[10px] text-gray-600 mt-1 inline-block">
                  📍 {entry.location}
                </span>
              )}
            </div>
          </a>
        ))}
      </div>

      {entries.length > 1 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full text-center text-xs text-gray-500 hover:text-gray-300 py-2 transition"
        >
          전체 {entries.length}개 보기
        </button>
      )}
    </div>
  );
}
