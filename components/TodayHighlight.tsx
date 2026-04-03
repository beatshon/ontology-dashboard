"use client";

import { useEffect, useState } from "react";

interface HighlightEntry {
  title: string;
  area: string;
  emoji: string;
  date: string;
  sentiment: string | null;
  content: string;
  url: string;
}

const SENTIMENT_EMOJI: Record<string, string> = {
  "긍정": "😊",
  "부정": "😔",
  "중립": "😐",
};

const AREA_COLOR: Record<string, string> = {
  "나": "#4ade80",
  "일": "#60a5fa",
  "관계": "#f472b6",
  "배움": "#a78bfa",
  "건강": "#fb923c",
  "가족": "#f9a8d4",
  "경제적 자유": "#fbbf24",
  "이룸": "#34d399",
};

const MOTIVATIONAL_MESSAGES = [
  "오늘의 첫 기록을 남겨보세요",
  "오늘 하루, 어떤 순간이 있었나요?",
  "작은 기록이 큰 변화를 만들어요",
];

export default function TodayHighlight() {
  const [entry, setEntry] = useState<HighlightEntry | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("https://api.againline.kr/api/cache/timeline")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const entries: HighlightEntry[] = d.entries || [];
        const today = new Date().toISOString().slice(0, 10);
        const todayEntry = entries.find((e) => e.date === today);
        setEntry(todayEntry || null);
        setLoaded(true);
      })
      .catch(() => {
        fetch("/api/timeline")
          .then((r) => r.json())
          .then((d) => {
            const entries: HighlightEntry[] = d.entries || [];
            const today = new Date().toISOString().slice(0, 10);
            const todayEntry = entries.find((e) => e.date === today);
            setEntry(todayEntry || null);
            setLoaded(true);
          })
          .catch(() => setLoaded(true));
      });
  }, []);

  if (!loaded) {
    return (
      <div className="toss-card animate-pulse">
        <div className="h-20 bg-[#222] rounded-xl" />
      </div>
    );
  }

  const motivational =
    MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

  if (!entry) {
    return (
      <div className="toss-card">
        <div className="flex items-center gap-4">
          <span className="text-3xl">📝</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-300">
              오늘의 하이라이트
            </h3>
            <p className="text-sm text-gray-500 mt-1">{motivational}</p>
          </div>
        </div>
      </div>
    );
  }

  const areaColor = AREA_COLOR[entry.area] || "#888";

  return (
    <div className="toss-card" style={{ borderLeft: `3px solid ${areaColor}` }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🌟</span>
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-widest">
          오늘의 하이라이트
        </h3>
      </div>

      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: areaColor + "22",
                  color: areaColor,
                }}
              >
                {entry.emoji} {entry.area}
              </span>
              {entry.sentiment && (
                <span className="text-sm">
                  {SENTIMENT_EMOJI[entry.sentiment] || ""}
                </span>
              )}
            </div>

            <h4 className="text-base font-semibold text-gray-200 group-hover:text-white transition mb-1.5">
              {entry.title}
            </h4>

            {entry.content && (
              <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                {entry.content}
              </p>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
