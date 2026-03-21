"use client";

import { useEffect, useState } from "react";
import type { AchievementTrend } from "@/types";
import AchievementTrendChart from "./AchievementTrend";

export default function AsyncAchievementTrend() {
  const [data, setData] = useState<AchievementTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievement-trend")
      .then((r) => r.json())
      .then((d: AchievementTrend[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#111] rounded-xl p-6 border border-[#222]">
        <h2 className="text-lg font-semibold text-white mb-4">🏆 이룸 포인트 트렌드</h2>
        <p className="text-[#555] text-sm">로딩 중...</p>
      </div>
    );
  }

  return <AchievementTrendChart data={data} />;
}
