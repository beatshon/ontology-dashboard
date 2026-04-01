"use client";

import { useEffect, useState } from "react";

interface OnThisDayEntry {
  title: string;
  area: string;
  emoji: string;
  date: string;
  yearsAgo: number;
  sentiment: string | null;
  content: string;
  url: string;
}

const SENTIMENT_EMOJI: Record<string, string> = {
  긍정: "😊",
  중립: "😐",
  부정: "😔",
};

export default function OnThisDay() {
  const [entries, setEntries] = useState<OnThisDayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    const today = new Date();
    setDateLabel(
      `${today.getMonth() + 1}월 ${today.getDate()}일`
    );

    fetch("/api/on-this-day")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-white/60 mb-3">
          On This Day
        </h3>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-white/60 mb-2">
          On This Day ({dateLabel})
        </h3>
        <p className="text-xs text-white/40">
          이 날의 과거 기록이 없습니다
        </p>
      </div>
    );
  }

  // Group by yearsAgo
  const grouped = entries.reduce<Record<number, OnThisDayEntry[]>>(
    (acc, entry) => {
      const key = entry.yearsAgo;
      return { ...acc, [key]: [...(acc[key] || []), entry] };
    },
    {}
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold text-white/60 mb-4">
        On This Day ({dateLabel})
      </h3>

      <div className="space-y-4">
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([yearsAgo, items]) => (
            <div key={yearsAgo}>
              <div className="text-xs font-medium text-white/40 mb-2">
                {yearsAgo}년 전
              </div>
              <div className="space-y-2">
                {items.map((entry) => (
                  <a
                    key={entry.url}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{entry.emoji}</span>
                      <span className="text-sm font-medium text-white/90 line-clamp-1">
                        {entry.title}
                      </span>
                      {entry.sentiment && (
                        <span className="text-xs ml-auto">
                          {SENTIMENT_EMOJI[entry.sentiment] || ""}
                        </span>
                      )}
                    </div>
                    {entry.content && (
                      <p className="text-xs text-white/40 line-clamp-2 pl-6">
                        {entry.content}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
