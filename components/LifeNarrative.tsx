"use client";

import { useEffect, useState, useCallback } from "react";

interface NarrativeSection {
  title: string;
  content: string;
  area: string;
  sentiment: "positive" | "negative" | "neutral";
}

interface NarrativeData {
  month: string;
  year: number;
  monthNumber: number;
  total_records: number;
  narrative_sections: NarrativeSection[];
  emotional_arc: string;
  highlights: string[];
}

function getSentimentAccent(sentiment: "positive" | "negative" | "neutral"): string {
  if (sentiment === "positive") return "#4ade80";
  if (sentiment === "negative") return "#f87171";
  return "#9ca3af";
}

function estimateReadingTime(sections: NarrativeSection[]): number {
  const totalChars = sections.reduce((sum, s) => sum + s.content.length, 0);
  // Korean: ~500 chars/min reading speed
  return Math.max(1, Math.round(totalChars / 500));
}

export default function LifeNarrative() {
  const [data, setData] = useState<NarrativeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Month navigation
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const fetchNarrative = useCallback(() => {
    setLoading(true);
    fetch(`/api/narrative?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d: NarrativeData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [year, month]);

  useEffect(() => {
    fetchNarrative();
  }, [fetchNarrative]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;

    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleCopy = async () => {
    if (!data) return;
    const text = data.narrative_sections
      .map((s) => `[${s.title}]\n${s.content}`)
      .join("\n\n");
    const fullText = `${data.month} 라이프 내러티브\n\n${text}\n\n${data.emotional_arc}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const readingTime = data ? estimateReadingTime(data.narrative_sections) : 0;

  if (loading) {
    return (
      <div className="toss-card mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-bold mb-4">라이프 내러티브</h2>
        <div className="h-48 skeleton-shimmer rounded-xl" />
      </div>
    );
  }

  if (!data || data.total_records === 0) {
    return (
      <div
        className="rounded-2xl border border-[#2a2a2a] p-5 sm:p-7 mb-4 sm:mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(13,13,13,1) 100%)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📖</span>
          <h2 className="text-xs font-semibold text-[#888] uppercase tracking-widest">
            라이프 내러티브
          </h2>
        </div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="text-gray-500 hover:text-white transition text-sm px-2 py-1">
            ←
          </button>
          <span className="text-sm font-medium text-gray-300">{year}년 {month}월</span>
          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className="text-gray-500 hover:text-white transition text-sm px-2 py-1 disabled:opacity-20"
          >
            →
          </button>
        </div>
        <p className="text-sm text-gray-500 text-center py-6">
          이 달의 기록이 아직 없어요. 기록을 남기면 내러티브가 생성됩니다.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-[#2a2a2a] p-5 sm:p-7 mb-4 sm:mb-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(253,186,116,0.03) 40%, rgba(13,13,13,1) 100%)",
      }}
    >
      {/* Warm glow decoration */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <h2 className="text-xs font-semibold text-[#888] uppercase tracking-widest">
              라이프 내러티브
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600">{readingTime}분 읽기</span>
            <button
              onClick={handleCopy}
              className="text-[10px] text-gray-500 hover:text-white transition px-2 py-1 rounded-lg border border-white/5 hover:border-white/10"
            >
              {copied ? "복사됨!" : "복사"}
            </button>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={handlePrevMonth}
            className="text-gray-500 hover:text-white transition text-lg px-2 py-1 rounded-lg hover:bg-white/5"
          >
            ←
          </button>
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-white">{data.month}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              총 {data.total_records}건의 기록
            </p>
          </div>
          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className="text-gray-500 hover:text-white transition text-lg px-2 py-1 rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent"
          >
            →
          </button>
        </div>

        {/* Highlights badges */}
        {data.highlights.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5 justify-center">
            {data.highlights.map((h) => (
              <span
                key={h}
                className="px-2.5 py-1 rounded-full text-[11px] bg-white/[0.05] text-gray-300 border border-white/5"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Narrative sections */}
        <div className="space-y-4">
          {data.narrative_sections.map((section, i) => (
            <div
              key={`${section.title}-${i}`}
              className="relative"
            >
              {/* Section connector line */}
              {i > 0 && i < data.narrative_sections.length - 1 && (
                <div className="absolute -top-2 left-4 w-px h-2 bg-white/5" />
              )}

              <div
                className="rounded-xl px-4 py-3.5 border border-white/5"
                style={{
                  backgroundColor: `${getSentimentAccent(section.sentiment)}06`,
                }}
              >
                {/* Section title with accent dot */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getSentimentAccent(section.sentiment) }}
                  />
                  <h3 className="text-xs font-semibold text-gray-400">
                    {section.title}
                  </h3>
                </div>

                {/* Section content */}
                <p className="text-sm sm:text-[15px] text-gray-200 leading-relaxed pl-3.5">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Emotional arc */}
        {data.emotional_arc && (
          <div className="mt-5 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500 mb-1">감정 여정</p>
            <p className="text-sm text-amber-400/80 italic font-medium">
              &ldquo;{data.emotional_arc}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
