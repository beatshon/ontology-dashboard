export const runtime = "edge";

import {
  fetchAchievements,
  fetchWeeklyTrend,
  fetchMonthlyRecordCounts,
  fetchDailyHeatmap,
  fetchMonthlyComparison,
} from "@/lib/notion";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const start = url.searchParams.get("start") || undefined;

  try {
    const [achievements, trend, monthlyCounts] = await Promise.all([
      fetchAchievements(20, start),
      fetchWeeklyTrend(12),
      fetchMonthlyRecordCounts(),
    ]);

    await delay(500);

    const [heatmapData, monthlyComparison] = await Promise.all([
      fetchDailyHeatmap(365),
      fetchMonthlyComparison(),
    ]);

    return Response.json(
      { achievements, trend, monthlyCounts, heatmapData, monthlyComparison },
      { headers: CACHE_HEADERS }
    );
  } catch {
    return Response.json({
      achievements: [],
      trend: [],
      monthlyCounts: [],
      heatmapData: [],
      monthlyComparison: [],
    });
  }
}
