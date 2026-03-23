"use client";

import { useEffect, useState } from "react";
import { AREAS } from "@/lib/areas";
import { getDateRange } from "@/components/PeriodFilter";
import type { PeriodKey } from "@/components/PeriodFilter";
import type {
  AreaData,
  SentimentRecord,
  RelationNode,
  AchievementTrend,
} from "@/types";

import StatsChart from "@/components/StatsChart";
import BalanceRadar from "@/components/BalanceRadar";
import TrendChart from "@/components/TrendChart";
import GoalProgress from "@/components/GoalProgress";
import AreaCard from "@/components/AreaCard";
import AchievementGallery from "@/components/AchievementGallery";
import Heatmap from "@/components/Heatmap";
import MonthlyComparisonChart from "@/components/MonthlyComparison";
import PeriodFilter from "@/components/PeriodFilter";
import SentimentChart from "@/components/SentimentChart";
import RelationNetwork from "@/components/RelationNetwork";
import AchievementTrendChart from "@/components/AchievementTrend";
import DayOneArchive from "@/components/DayOneArchive";
import RecentTimeline from "@/components/RecentTimeline";
import YouTubeSection from "@/components/YouTubeSection";
import SearchBar from "@/components/SearchBar";
import TitleBadge from "@/components/TitleBadge";
import Navigation from "@/components/Navigation";

function LoadingCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6 animate-pulse">
      <h2 className="text-base sm:text-lg font-bold mb-4">{title}</h2>
      <div className="h-24 sm:h-32 bg-[#222] rounded" />
    </div>
  );
}

export default function DashboardClient() {
  // URL에서 period 파라미터 추출 (클라이언트 사이드)
  const [period, setPeriod] = useState<PeriodKey>("all");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("period") as PeriodKey;
    if (p) setPeriod(p);
  }, []);
  const { start } = getDateRange(period);

  const [areasData, setAreasData] = useState<AreaData[] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentRecord[] | null>(null);
  const [relationData, setRelationData] = useState<RelationNode[] | null>(null);
  const [achievementTrend, setAchievementTrend] = useState<AchievementTrend[] | null>(null);

  // 캐시 우선 fetch (빠름) → 실패 시 직접 API (느림)
  const fetchCacheFirst = (cacheUrl: string, fallbackUrl: string) =>
    fetch(cacheUrl).then((r) => r.ok ? r.json() : Promise.reject()).catch(() => fetch(fallbackUrl).then((r) => r.json()));

  const CACHE = "https://api.againline.kr";
  const fetchAll = () => {
    const qs = start ? `?start=${start}` : "";
    fetch(`/api/areas${qs}`).then((r) => r.json()).then(setAreasData).catch(() => setAreasData([]));
    fetch(`/api/stats${qs}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ achievements: [], trend: [], monthlyCounts: [], heatmapData: [], monthlyComparison: [] }));
    fetchCacheFirst(`${CACHE}/api/cache/sentiment`, "/api/sentiment").then(setSentimentData).catch(() => setSentimentData([]));
    fetchCacheFirst(`${CACHE}/api/cache/relation`, "/api/relation").then(setRelationData).catch(() => setRelationData([]));
    fetchCacheFirst(`${CACHE}/api/cache/achievement-trend`, "/api/achievement-trend").then(setAchievementTrend).catch(() => setAchievementTrend([]));
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000); // 5분
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  const now = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const chartStats = areasData?.map((d) => ({
    area: d.area.key,
    emoji: d.area.emoji,
    count: d.total,
    color: d.area.color,
  })) || [];

  return (
    <main className="max-w-7xl mx-auto px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      {/* 헤더 */}
      <div className="mb-6 sm:mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            온톨로지 대시보드
          </h1>
          <p className="text-[#555] mt-1 text-xs sm:text-sm">제이스의 삶의 기록</p>
        </div>
        <span className="text-[10px] sm:text-xs text-[#444]">{now}</span>
      </div>

      <TitleBadge />
      <Navigation />
      <PeriodFilter current={period} />

      <SearchBar />

      {/* Day One 아카이브 + 최근 기록 타임라인 (상단) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <RecentTimeline />
        <DayOneArchive />
      </div>

      {/* 상단 요약 */}
      {areasData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <StatsChart stats={chartStats} />
          </div>
          <BalanceRadar stats={chartStats} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <LoadingCard title="영역별 기록" />
          <LoadingCard title="삶의 균형" />
        </div>
      )}

      {/* 트렌드 + 목표 */}
      {stats && areasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="lg:col-span-2">
            <TrendChart data={stats.trend} />
          </div>
          <GoalProgress areasData={areasData} monthlyRecordCounts={stats.monthlyCounts} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="lg:col-span-2"><LoadingCard title="주간 기록 트렌드" /></div>
          <LoadingCard title="이번 달 목표" />
        </div>
      )}

      {/* 감정 흐름 + 관계 네트워크 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {sentimentData ? <SentimentChart data={sentimentData} /> : <LoadingCard title="😊 감정 흐름" />}
        {relationData ? <RelationNetwork data={relationData} /> : <LoadingCard title="🤝 관계 네트워크" />}
      </div>

      {/* 이룸 트렌드 + 월간 비교 + YouTube */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {achievementTrend ? <AchievementTrendChart data={achievementTrend} /> : <LoadingCard title="🏆 이룸 포인트 트렌드" />}
        {stats ? <MonthlyComparisonChart data={stats.monthlyComparison} /> : <LoadingCard title="월간 비교" />}
        <YouTubeSection />
      </div>

      {/* 영역 카드 */}
      <div className="mb-4">
        <h2 className="text-xs sm:text-sm font-semibold text-[#888] uppercase tracking-widest mb-3 sm:mb-4">
          7가지 영역
        </h2>
        {areasData ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
            {areasData.map((data) => (
              <AreaCard key={data.area.key} data={data} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
            {AREAS.map((a) => <LoadingCard key={a.key} title={`${a.emoji} ${a.label}`} />)}
          </div>
        )}
      </div>

      {/* 히트맵 */}
      <div className="mt-6 sm:mt-8 overflow-x-auto">
        {stats ? <Heatmap data={stats.heatmapData} /> : <LoadingCard title="연간 기록 히트맵" />}
      </div>

      {/* 이룸 갤러리 */}
      <div className="mt-6 sm:mt-8">
        {stats ? <AchievementGallery achievements={stats.achievements} /> : <LoadingCard title="이룸 갤러리" />}
      </div>

    </main>
  );
}
