export const runtime = "edge";

import { AREAS, fetchAreaData } from "@/lib/notion";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

interface AreaTransition {
  from: string;
  to: string;
  count: number;
  sentiment_flow: "positive" | "negative" | "neutral";
}

interface DailyFlow {
  date: string;
  sequence: string[];
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET() {
  try {
    // Fetch records from all 7 areas with enough depth (up to 50 recent records each)
    const b1 = await Promise.all(AREAS.slice(0, 4).map((a) => fetchAreaData(a, 50)));
    await delay(200);
    const b2 = await Promise.all(AREAS.slice(4).map((a) => fetchAreaData(a, 50)));
    const allAreaData = [...b1, ...b2];

    // Group all records by date, tagging each with its area
    const dateMap: Record<string, { area: string; createdAt: string; title: string }[]> = {};

    for (const areaData of allAreaData) {
      for (const record of areaData.records) {
        const date = (record.date || record.createdAt).slice(0, 10);
        if (!dateMap[date]) {
          dateMap[date] = [];
        }
        dateMap[date].push({
          area: areaData.area.key,
          createdAt: record.createdAt,
          title: record.title,
        });
      }
    }

    // Build daily flows: for each day with 2+ area records, create sequence by time
    const dailyFlows: DailyFlow[] = [];
    const transitionCounts: Record<string, { count: number; sentiments: string[] }> = {};

    const sortedDates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a));

    for (const date of sortedDates) {
      const records = dateMap[date];
      if (records.length < 2) continue;

      // Sort by created time
      const sorted = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      // Deduplicate consecutive same-area entries to get area transitions
      const areaSequence: string[] = [];
      for (const rec of sorted) {
        if (areaSequence.length === 0 || areaSequence[areaSequence.length - 1] !== rec.area) {
          areaSequence.push(rec.area);
        }
      }

      if (areaSequence.length >= 2) {
        dailyFlows.push({ date, sequence: areaSequence });

        // Count transitions
        for (let i = 0; i < areaSequence.length - 1; i++) {
          const key = `${areaSequence[i]}::${areaSequence[i + 1]}`;
          if (!transitionCounts[key]) {
            transitionCounts[key] = { count: 0, sentiments: [] };
          }
          transitionCounts[key].count += 1;
        }
      }
    }

    // Build patterns sorted by frequency
    const patterns: AreaTransition[] = Object.entries(transitionCounts)
      .map(([key, data]) => {
        const [from, to] = key.split("::");
        // Determine sentiment flow based on target area heuristic
        const positiveTargets = ["건강", "배움", "가족", "이룸"];
        const negativeTargets = ["일"]; // work stress often triggers others
        let sentimentFlow: "positive" | "negative" | "neutral" = "neutral";
        if (positiveTargets.includes(to)) sentimentFlow = "positive";
        if (negativeTargets.includes(to) && from !== "일") sentimentFlow = "negative";

        return {
          from,
          to,
          count: data.count,
          sentiment_flow: sentimentFlow,
        };
      })
      .sort((a, b) => b.count - a.count);

    return Response.json(
      {
        patterns,
        daily_flows: dailyFlows.slice(0, 30), // last 30 days with flows
      },
      { headers: CACHE_HEADERS },
    );
  } catch {
    return Response.json({ patterns: [], daily_flows: [] });
  }
}
