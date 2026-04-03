"use client";

import { useState, useMemo, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  title: string;
  area: string;
  emoji: string;
  date: string;
  content: string;
  sentiment: string | null;
  url: string;
}

const SENTIMENT_EMOJI: Record<string, string> = {
  "긍정": "😊", "부정": "😔", "중립": "😐",
};

type AreaFilter = "나" | "일" | "관계" | "배움" | "건강" | "가족" | "경제적 자유";
type SentimentFilter = "긍정" | "중립" | "부정";
type PeriodFilter = "today" | "week" | "month";

const AREA_CHIPS: { value: AreaFilter; emoji: string }[] = [
  { value: "나", emoji: "🌱" },
  { value: "일", emoji: "💼" },
  { value: "관계", emoji: "🤝" },
  { value: "배움", emoji: "📚" },
  { value: "건강", emoji: "🏃" },
  { value: "가족", emoji: "🏡" },
  { value: "경제적 자유", emoji: "💰" },
];

const SENTIMENT_CHIPS: { value: SentimentFilter; emoji: string }[] = [
  { value: "긍정", emoji: "😊" },
  { value: "중립", emoji: "😐" },
  { value: "부정", emoji: "😔" },
];

const PERIOD_CHIPS: { value: PeriodFilter; label: string }[] = [
  { value: "today", label: "오늘" },
  { value: "week", label: "이번주" },
  { value: "month", label: "이번달" },
];

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export interface SearchBarHandle {
  focus: () => void;
}

const SearchBar = forwardRef<SearchBarHandle>(function SearchBar(_props, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filter states
  const [activeAreas, setActiveAreas] = useState<Set<AreaFilter>>(new Set());
  const [activeSentiments, setActiveSentiments] = useState<Set<SentimentFilter>>(new Set());
  const [activePeriod, setActivePeriod] = useState<PeriodFilter | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  }));

  const toggleArea = (area: AreaFilter) => {
    setActiveAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const toggleSentiment = (sentiment: SentimentFilter) => {
    setActiveSentiments((prev) => {
      const next = new Set(prev);
      if (next.has(sentiment)) next.delete(sentiment);
      else next.add(sentiment);
      return next;
    });
  };

  const togglePeriod = (period: PeriodFilter) => {
    setActivePeriod((prev) => (prev === period ? null : period));
  };

  const hasFilters = activeAreas.size > 0 || activeSentiments.size > 0 || activePeriod !== null;

  const handleSearch = useCallback(async () => {
    if (!query.trim() && !hasFilters) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (activeAreas.size > 0) params.set("areas", Array.from(activeAreas).join(","));
      if (activeSentiments.size > 0) params.set("sentiments", Array.from(activeSentiments).join(","));
      if (activePeriod) params.set("period", activePeriod);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      const allResults: SearchResult[] = data.results ?? [];

      // Client-side filter application for filters not supported by API
      const filtered = applyClientFilters(allResults);
      setResults(filtered);
      setTotal(filtered.length);
    } catch {
      setResults([]);
      setTotal(0);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeAreas, activeSentiments, activePeriod, hasFilters]);

  // Debounced auto-search when query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2 || hasFilters) {
      handleSearch();
    } else if (debouncedQuery.trim().length === 0 && !hasFilters) {
      setResults(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, activeAreas, activeSentiments, activePeriod]);

  const applyClientFilters = (items: SearchResult[]): SearchResult[] => {
    let filtered = items;

    if (activeAreas.size > 0) {
      filtered = filtered.filter((r) => activeAreas.has(r.area as AreaFilter));
    }

    if (activeSentiments.size > 0) {
      filtered = filtered.filter(
        (r) => r.sentiment && activeSentiments.has(r.sentiment as SentimentFilter),
      );
    }

    if (activePeriod) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      if (activePeriod === "today") {
        filtered = filtered.filter((r) => r.date === todayStr);
      } else if (activePeriod === "week") {
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - mondayOffset);
        const weekStartStr = weekStart.toISOString().slice(0, 10);
        filtered = filtered.filter((r) => r.date >= weekStartStr);
      } else if (activePeriod === "month") {
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        filtered = filtered.filter((r) => r.date >= monthStart);
      }
    }

    return filtered;
  };

  // Filtered results count
  const filteredResults = useMemo(() => {
    if (!results) return null;
    return results;
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="mb-6 sm:mb-8">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="온톨로지 검색... (예: 운동, 세라젬, 은채)"
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/30 transition"
          />
          <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 text-[10px] text-gray-600 bg-[#222] border border-[#333] rounded px-1.5 py-0.5 pointer-events-none">
            <span className="text-[9px]">&#8984;</span>K
          </kbd>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-[#333] hover:bg-[#444] text-white px-4 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
        >
          {loading ? "..." : "🔍"}
        </button>
      </div>

      {/* Filter chips */}
      <div className="mt-3 space-y-2">
        {/* Area filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-600 mr-1">영역별</span>
          {AREA_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => toggleArea(chip.value)}
              className={`px-2 py-1 rounded-lg text-[11px] transition-all duration-200 border ${
                activeAreas.has(chip.value)
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-[#333] text-gray-500 hover:border-[#444] hover:text-gray-400"
              }`}
            >
              {chip.emoji} {chip.value}
            </button>
          ))}
        </div>

        {/* Sentiment filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-600 mr-1">감정별</span>
          {SENTIMENT_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => toggleSentiment(chip.value)}
              className={`px-2 py-1 rounded-lg text-[11px] transition-all duration-200 border ${
                activeSentiments.has(chip.value)
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-[#333] text-gray-500 hover:border-[#444] hover:text-gray-400"
              }`}
            >
              {chip.emoji} {chip.value}
            </button>
          ))}
        </div>

        {/* Period filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-600 mr-1">기간별</span>
          {PERIOD_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => togglePeriod(chip.value)}
              className={`px-2 py-1 rounded-lg text-[11px] transition-all duration-200 border ${
                activePeriod === chip.value
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-[#333] text-gray-500 hover:border-[#444] hover:text-gray-400"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search results */}
      {filteredResults !== null && (
        <div className="mt-3 rounded-2xl bg-[#1a1a1a] p-4 max-h-96 overflow-y-auto">
          {filteredResults.length === 0 ? (
            <p className="text-gray-500 text-sm">검색 결과가 없어요.</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">
                {total}건 발견
                {hasFilters && <span className="text-gray-600 ml-1">(필터 적용됨)</span>}
              </p>
              <div className="space-y-2">
                {filteredResults.map((r, i) => (
                  <a
                    key={`${r.title}-${i}`}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg bg-[#222] p-3 hover:bg-[#2a2a2a] transition border border-transparent hover:border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-gray-500">{r.date}</span>
                      <span className="text-[10px] text-gray-500">{r.emoji} {r.area}</span>
                      {r.sentiment && (
                        <span className="text-[10px]">{SENTIMENT_EMOJI[r.sentiment] || ""}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-200">
                      <HighlightText text={r.title} query={query} />
                    </h3>
                    {r.content && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        <HighlightText text={r.content} query={query} />
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => { setResults(null); setQuery(""); }}
            className="mt-3 text-xs text-gray-600 hover:text-gray-400 transition"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
});

export default SearchBar;
