// Cloudflare Pages는 Edge runtime만 지원하므로 유지
export const runtime = "edge";

import {
  AREAS,
  fetchAreaData,
  fetchAchievements,
  fetchWeeklyTrend,
  fetchMonthlyRecordCounts,
  fetchDailyHeatmap,
  fetchMonthlyComparison,
} from "@/lib/notion";
import StatsChart from "@/components/StatsChart";
import BalanceRadar from "@/components/BalanceRadar";
import TrendChart from "@/components/TrendChart";
import GoalProgress from "@/components/GoalProgress";
import AreaCard from "@/components/AreaCard";
import AchievementGallery from "@/components/AchievementGallery";
import Heatmap from "@/components/Heatmap";
import MonthlyComparisonChart from "@/components/MonthlyComparison";
import PeriodFilter, { getDateRange } from "@/components/PeriodFilter";
import AsyncSentimentChart from "@/components/AsyncSentimentChart";
import AsyncRelationNetwork from "@/components/AsyncRelationNetwork";
import AsyncAchievementTrend from "@/components/AsyncAchievementTrend";
import type { PeriodKey } from "@/components/PeriodFilter";

export const revalidate = 0;

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const period = (params.period as PeriodKey) || "all";
  const { start } = getDateRange(period);

  // 순차 실행 (Notion API 속도 제한 3 req/sec 대응)
  const areasData = [];
  for (const a of AREAS) {
    areasData.push(await fetchAreaData(a, 5, start));
  }
  const achievements = await fetchAchievements(20, start);
  const trend = await fetchWeeklyTrend(12);
  const monthlyCounts = await fetchMonthlyRecordCounts();
  const heatmapData = await fetchDailyHeatmap(365);

  const monthlyComparison = await fetchMonthlyComparison();

  const stats = areasData.map((d) => ({
    area: d.area.key,
    emoji: d.area.emoji,
    count: d.total,
    color: d.area.color,
  }));

  const now = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            온톨로지 대시보드
          </h1>
          <p className="text-[#555] mt-1 text-sm">제이스의 삶의 기록</p>
        </div>
        <span className="text-xs text-[#444]">{now}</span>
      </div>

      {/* 기간 필터 */}
      <div className="mb-6">
        <PeriodFilter current={period} basePath="/" />
      </div>

      {/* Stats 차트 + 레이더 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <StatsChart stats={stats} />
        <BalanceRadar stats={stats} />
      </div>

      {/* 트렌드 차트 + 목표 프로그레스 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <TrendChart data={trend} />
        </div>
        <GoalProgress areasData={areasData} monthlyRecordCounts={monthlyCounts} />
      </div>

      {/* 감정 흐름 + 관계 네트워크 (클라이언트에서 별도 fetch) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <AsyncSentimentChart />
        <AsyncRelationNetwork />
      </div>

      {/* 이룸 포인트 트렌드 + 월간 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <AsyncAchievementTrend />
        <MonthlyComparisonChart data={monthlyComparison} />
      </div>

      {/* 영역 카드 그리드 */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest mb-4">
          7가지 영역
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {areasData.map((data) => (
            <AreaCard key={data.area.key} data={data} />
          ))}
        </div>
      </div>

      {/* 연간 히트맵 */}
      <div className="mt-8">
        <Heatmap data={heatmapData} />
      </div>

      {/* 이룸 갤러리 */}
      <div className="mt-8">
        <AchievementGallery achievements={achievements} />
      </div>

    </main>
  );
}
