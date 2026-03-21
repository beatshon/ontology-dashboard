"use client";

import { useEffect, useState } from "react";

interface DayOneEntry {
  uuid: string;
  text: string;
  date: string | null;
  hasPhoto: boolean;
  location: string | null;
  weather: string | null;
}

const PHOTO_BASE = "https://dayone-photos.pages.dev";

export default function DayOneArchive() {
  const [entries, setEntries] = useState<DayOneEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/dayone-map.json")
      .then((r) => r.json())
      .then((d: DayOneEntry[]) => setEntries(d))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-6">
        <h2 className="text-lg font-bold mb-4">📔 Day One 일기 아카이브</h2>
        <p className="text-gray-500 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (entries.length === 0) return null;

  const withPhoto = entries.filter((e) => e.hasPhoto);
  const years = [...new Set(entries.map((e) => e.date?.slice(0, 4)).filter(Boolean))].sort();
  const dateRange = years.length > 0 ? `${years[0]}–${years[years.length - 1]}` : "";
  const displayed = showAll ? entries : entries.slice(0, 12);

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-6">
      {/* 헤더 */}
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-bold">📔 Day One 일기 아카이브</h2>
        <span className="text-xs text-gray-500">{dateRange}</span>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        {entries.length}개의 일기 · 사진 {withPhoto.length}장
      </p>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
        {displayed.map((entry) => (
          <div
            key={entry.uuid}
            className="group rounded-xl bg-[#222] border border-gray-800/40 overflow-hidden hover:bg-[#2a2a2a] hover:border-gray-600/50 transition"
          >
            {/* 썸네일 */}
            {entry.hasPhoto && (
              <div className="w-full h-40 overflow-hidden bg-[#1a1a1a]">
                <img
                  src={`${PHOTO_BASE}/${entry.uuid}.jpg`}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}

            <div className="p-4">
              {/* 날짜 */}
              {entry.date && (
                <span className="text-[10px] text-gray-600">{entry.date}</span>
              )}

              {/* 본문 */}
              <p className="text-sm text-gray-300 mt-1 line-clamp-4 leading-relaxed">
                {entry.text}
              </p>

              {/* 위치 + 날씨 */}
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.location && (
                  <span className="text-[10px] text-gray-600 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                    📍 {entry.location}
                  </span>
                )}
                {entry.weather && (
                  <span className="text-[10px] text-gray-600 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                    🌤 {entry.weather}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 더 보기 */}
      {entries.length > 12 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-300 py-2 transition"
        >
          전체 {entries.length}개 보기
        </button>
      )}
    </div>
  );
}
