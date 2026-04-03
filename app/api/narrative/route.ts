export const runtime = "edge";

import { AREAS, fetchAreaData } from "@/lib/notion";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
};

interface NarrativeSection {
  title: string;
  content: string;
  area: string;
  sentiment: "positive" | "negative" | "neutral";
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: Request) {
  const url = new URL(request.url);
  const yearParam = url.searchParams.get("year");
  const monthParam = url.searchParams.get("month");

  const now = new Date();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  try {
    // Fetch records for all areas (use 100 to get monthly volume)
    const b1 = await Promise.all(AREAS.slice(0, 4).map((a) => fetchAreaData(a, 100, startDate)));
    await delay(200);
    const b2 = await Promise.all(AREAS.slice(4).map((a) => fetchAreaData(a, 100, startDate)));
    const allAreaData = [...b1, ...b2];

    // Filter records to the target month only
    const areaRecordCounts: Record<string, number> = {};
    const areaTitles: Record<string, string[]> = {};
    let totalRecords = 0;

    for (const areaData of allAreaData) {
      const key = areaData.area.key;
      const monthRecords = areaData.records.filter((r) => {
        const d = (r.date || r.createdAt).slice(0, 10);
        return d >= startDate && d < endDate;
      });
      areaRecordCounts[key] = monthRecords.length;
      areaTitles[key] = monthRecords.slice(0, 5).map((r) => r.title);
      totalRecords += monthRecords.length;
    }

    // Find most/least active areas
    const sortedAreas = AREAS
      .map((a) => ({ ...a, count: areaRecordCounts[a.key] || 0 }))
      .sort((a, b) => b.count - a.count);

    const mostActive = sortedAreas[0];
    const leastActive = sortedAreas.filter((a) => a.count >= 0).pop() ?? sortedAreas[sortedAreas.length - 1];

    // Build narrative sections
    const sections: NarrativeSection[] = [];

    // Opening section
    const monthName = `${year}년 ${month}월`;
    sections.push({
      title: "한 달의 시작",
      content: totalRecords > 0
        ? `${monthName}, 제이스의 한 달은 ${mostActive.emoji} ${mostActive.key} 영역으로 가득했습니다. 총 ${totalRecords}건의 기록이 ${Object.values(areaRecordCounts).filter((c) => c > 0).length}개 영역에 걸쳐 남겨졌어요.`
        : `${monthName}의 기록이 아직 시작되지 않았습니다. 첫 기록을 남겨보세요.`,
      area: mostActive.key,
      sentiment: totalRecords > 10 ? "positive" : "neutral",
    });

    // Area highlights
    for (const area of sortedAreas) {
      if (area.count === 0) continue;
      const titles = areaTitles[area.key] || [];
      const titleSnippet = titles.length > 0
        ? titles.slice(0, 3).map((t) => `"${t}"`).join(", ")
        : "";

      let areaContent = "";
      if (area.key === mostActive.key) {
        areaContent = `가장 활발했던 ${area.emoji} ${area.key} 영역에서 ${area.count}건의 기록이 남겨졌습니다.`;
      } else {
        areaContent = `${area.emoji} ${area.key} 영역에서는 ${area.count}건의 기록이 있었어요.`;
      }
      if (titleSnippet) {
        areaContent += ` ${titleSnippet} 등의 순간들이 기억에 남습니다.`;
      }

      sections.push({
        title: `${area.emoji} ${area.key}`,
        content: areaContent,
        area: area.key,
        sentiment: area.count >= 5 ? "positive" : area.count >= 2 ? "neutral" : "negative",
      });
    }

    // Closing section
    const balancedCount = sortedAreas.filter((a) => a.count >= 3).length;
    let closingContent = "";
    if (balancedCount >= 5) {
      closingContent = `이 달은 ${balancedCount}개 영역에서 균형 잡힌 기록을 남긴 달이었어요. 삶의 다양한 면을 고르게 돌보는 모습이 인상적입니다.`;
    } else if (mostActive.count > totalRecords * 0.5) {
      closingContent = `${mostActive.emoji} ${mostActive.key}에 집중한 달이었어요. 다음 달에는 ${leastActive.emoji} ${leastActive.key} 영역에도 관심을 기울여보는 건 어떨까요?`;
    } else {
      closingContent = `꾸준히 기록을 이어가고 있어요. 작은 기록들이 모여 큰 성장이 됩니다.`;
    }

    sections.push({
      title: "돌아보며",
      content: closingContent,
      area: "나",
      sentiment: "positive",
    });

    // Emotional arc summary
    const dominantSentiment = totalRecords > 15 ? "풍성함" : totalRecords > 5 ? "꾸준함" : "고요함";
    const emotionalArc = `이 달의 기록 여정은 '${dominantSentiment}'으로 요약할 수 있어요.`;

    // Highlights
    const highlights = sortedAreas
      .filter((a) => a.count > 0)
      .slice(0, 3)
      .map((a) => `${a.emoji} ${a.key}: ${a.count}건`);

    return Response.json(
      {
        month: monthName,
        year,
        monthNumber: month,
        total_records: totalRecords,
        narrative_sections: sections,
        emotional_arc: emotionalArc,
        highlights,
      },
      { headers: CACHE_HEADERS },
    );
  } catch {
    return Response.json({
      month: `${year}년 ${month}월`,
      year,
      monthNumber: month,
      total_records: 0,
      narrative_sections: [],
      emotional_arc: "",
      highlights: [],
    });
  }
}
