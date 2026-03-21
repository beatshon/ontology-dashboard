"use client";

import { useEffect, useState } from "react";
import type { SentimentRecord } from "@/types";
import SentimentChart from "./SentimentChart";

export default function AsyncSentimentChart() {
  const [data, setData] = useState<SentimentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sentiment")
      .then((r) => r.json())
      .then((d: SentimentRecord[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#111] rounded-xl p-6 border border-[#222]">
        <h2 className="text-lg font-semibold text-white mb-4">😊 감정 흐름</h2>
        <p className="text-[#555] text-sm">로딩 중...</p>
      </div>
    );
  }

  return <SentimentChart data={data} />;
}
