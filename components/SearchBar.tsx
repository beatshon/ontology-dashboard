"use client";

import { useState } from "react";

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

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results);
      setTotal(data.total);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="mb-6 sm:mb-8">
      {/* 검색 입력 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="온톨로지 검색... (예: 운동, 세라젬, 은채)"
          className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#555] transition"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-[#333] hover:bg-[#444] text-white px-4 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
        >
          {loading ? "..." : "🔍"}
        </button>
      </div>

      {/* 검색 결과 */}
      {results !== null && (
        <div className="mt-3 rounded-2xl bg-[#1a1a1a] p-4 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">검색 결과가 없어요.</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">{total}건 발견</p>
              <div className="space-y-2">
                {results.map((r, i) => (
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
                    <h3 className="text-sm font-medium text-gray-200">{r.title}</h3>
                    {r.content && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.content}</p>
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
}
