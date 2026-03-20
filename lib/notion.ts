import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { AreaConfig, AreaData, Achievement, NotionRecord, SentimentRecord, RelationNode, AchievementTrend } from "@/types";

export const AREAS: AreaConfig[] = [
  { key: "나", label: "나 (Me)", emoji: "🌱", color: "#4ade80", dbEnvKey: "NOTION_NA_DB_ID" },
  { key: "일", label: "일 (Work)", emoji: "💼", color: "#60a5fa", dbEnvKey: "NOTION_IL_DB_ID" },
  { key: "관계", label: "관계 (People)", emoji: "🤝", color: "#f472b6", dbEnvKey: "NOTION_GWANGYE_DB_ID" },
  { key: "배움", label: "배움 (Learn)", emoji: "📚", color: "#a78bfa", dbEnvKey: "NOTION_BAEUM_DB_ID" },
  { key: "건강", label: "건강 (Health)", emoji: "🏃", color: "#fb923c", dbEnvKey: "NOTION_GEONGANG_DB_ID" },
  { key: "가족", label: "가족 (Family)", emoji: "🏡", color: "#f9a8d4", dbEnvKey: "NOTION_GAJOK_DB_ID" },
  { key: "경제적 자유", label: "경제적 자유 (Finance)", emoji: "💰", color: "#fbbf24", dbEnvKey: "NOTION_GYEONGJE_DB_ID" },
];

function getClient() {
  return new Client({ auth: process.env.NOTION_TOKEN });
}

function extractTitle(page: PageObjectResponse): string {
  const props = page.properties;
  for (const prop of Object.values(props)) {
    if (prop.type === "title") {
      return prop.title.map((t) => t.plain_text).join("") || "제목 없음";
    }
  }
  return "제목 없음";
}

function extractText(page: PageObjectResponse, key: string): string | undefined {
  const prop = page.properties[key];
  if (!prop) return undefined;
  if (prop.type === "rich_text") {
    return prop.rich_text.map((t) => t.plain_text).join("") || undefined;
  }
  return undefined;
}

function extractDate(page: PageObjectResponse): string | undefined {
  const props = page.properties;
  for (const prop of Object.values(props)) {
    if (prop.type === "date" && prop.date?.start) return prop.date.start;
  }
  return undefined;
}

function extractSelect(page: PageObjectResponse, key: string): string | undefined {
  const prop = page.properties[key];
  if (!prop) return undefined;
  if (prop.type === "select") return prop.select?.name || undefined;
  if (prop.type === "multi_select") return prop.multi_select.map((s) => s.name).join(", ") || undefined;
  return undefined;
}

function extractNumber(page: PageObjectResponse, key: string): number | undefined {
  const prop = page.properties[key];
  if (!prop) return undefined;
  if (prop.type === "number") return prop.number ?? undefined;
  return undefined;
}

function toRecord(page: PageObjectResponse): NotionRecord {
  const contentKey = Object.keys(page.properties).find(
    (k) => page.properties[k].type === "rich_text"
  );
  return {
    id: page.id,
    title: extractTitle(page),
    content: contentKey ? extractText(page, contentKey) : undefined,
    date: extractDate(page),
    category:
      extractSelect(page, "유형") ||
      extractSelect(page, "카테고리") ||
      extractSelect(page, "영역") ||
      extractSelect(page, "핵심 가치관") ||
      undefined,
    createdAt: page.created_time,
  };
}

function buildDateFilter(startDate?: string | null) {
  if (!startDate) return undefined;
  return {
    timestamp: "created_time" as const,
    created_time: { on_or_after: startDate },
  };
}

export async function fetchAreaData(
  area: AreaConfig,
  limit = 5,
  startDate?: string | null,
): Promise<AreaData> {
  const notion = getClient();
  const dbId = process.env[area.dbEnvKey];
  if (!dbId) return { area, records: [], total: 0 };

  const filter = buildDateFilter(startDate);

  try {
    const [recent, all] = await Promise.all([
      notion.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: limit,
        ...(filter ? { filter } : {}),
      }),
      notion.databases.query({
        database_id: dbId,
        page_size: 100,
        ...(filter ? { filter } : {}),
      }),
    ]);

    const records = (recent.results as PageObjectResponse[]).map(toRecord);
    return { area, records, total: all.results.length };
  } catch {
    return { area, records: [], total: 0 };
  }
}

export async function fetchAllAreaRecords(area: AreaConfig): Promise<NotionRecord[]> {
  const notion = getClient();
  const dbId = process.env[area.dbEnvKey];
  if (!dbId) return [];

  try {
    const records: NotionRecord[] = [];
    let cursor: string | undefined;

    do {
      const res = await notion.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: 100,
        start_cursor: cursor,
      });

      records.push(...(res.results as PageObjectResponse[]).map(toRecord));
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);

    return records;
  } catch {
    return [];
  }
}

export async function fetchMonthlyRecordCounts(): Promise<Record<string, number>> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const counts: Record<string, number> = {};

  await Promise.all(
    AREAS.map(async (area) => {
      const notion = getClient();
      const dbId = process.env[area.dbEnvKey];
      if (!dbId) {
        counts[area.key] = 0;
        return;
      }
      try {
        const res = await notion.databases.query({
          database_id: dbId,
          filter: { timestamp: "created_time", created_time: { on_or_after: startOfMonth } },
          page_size: 100,
        });
        counts[area.key] = res.results.length;
      } catch {
        counts[area.key] = 0;
      }
    }),
  );

  return counts;
}

export interface WeeklyCount {
  week: string; // "MM/DD" format (week start)
  [areaKey: string]: number | string;
}

export async function fetchWeeklyTrend(weeks = 12): Promise<WeeklyCount[]> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - weeks * 7);
  const startStr = startDate.toISOString().split("T")[0];

  const allCounts = await Promise.all(
    AREAS.map(async (area) => {
      const notion = getClient();
      const dbId = process.env[area.dbEnvKey];
      if (!dbId) return { key: area.key, dates: [] as string[] };

      try {
        const res = await notion.databases.query({
          database_id: dbId,
          filter: { timestamp: "created_time", created_time: { on_or_after: startStr } },
          page_size: 100,
        });
        const dates = (res.results as PageObjectResponse[]).map((p) => p.created_time);
        return { key: area.key, dates };
      } catch {
        return { key: area.key, dates: [] as string[] };
      }
    }),
  );

  // Build week buckets
  const weekStarts: Date[] = [];
  const cursor = new Date(startDate);
  const day = cursor.getDay();
  cursor.setDate(cursor.getDate() - (day === 0 ? 6 : day - 1)); // Monday
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= now) {
    weekStarts.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  const result: WeeklyCount[] = weekStarts.map((ws) => {
    const label = `${ws.getMonth() + 1}/${ws.getDate()}`;
    const row: WeeklyCount = { week: label };
    for (const area of AREAS) {
      row[area.key] = 0;
    }
    return row;
  });

  for (const { key, dates } of allCounts) {
    for (const dateStr of dates) {
      const d = new Date(dateStr);
      for (let i = weekStarts.length - 1; i >= 0; i--) {
        if (d >= weekStarts[i]) {
          (result[i][key] as number) += 1;
          break;
        }
      }
    }
  }

  return result;
}

export interface MonthlyComparison {
  area: string;
  emoji: string;
  color: string;
  thisMonth: number;
  lastMonth: number;
}

export async function fetchMonthlyComparison(): Promise<MonthlyComparison[]> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .split("T")[0];

  const result: MonthlyComparison[] = [];

  await Promise.all(
    AREAS.map(async (area) => {
      const notion = getClient();
      const dbId = process.env[area.dbEnvKey];
      if (!dbId) {
        result.push({
          area: area.key,
          emoji: area.emoji,
          color: area.color,
          thisMonth: 0,
          lastMonth: 0,
        });
        return;
      }

      try {
        const [thisRes, lastRes] = await Promise.all([
          notion.databases.query({
            database_id: dbId,
            filter: { timestamp: "created_time", created_time: { on_or_after: thisMonthStart } },
            page_size: 100,
          }),
          notion.databases.query({
            database_id: dbId,
            filter: {
              and: [
                { timestamp: "created_time", created_time: { on_or_after: lastMonthStart } },
                { timestamp: "created_time", created_time: { before: thisMonthStart } },
              ],
            },
            page_size: 100,
          }),
        ]);

        result.push({
          area: area.key,
          emoji: area.emoji,
          color: area.color,
          thisMonth: thisRes.results.length,
          lastMonth: lastRes.results.length,
        });
      } catch {
        result.push({
          area: area.key,
          emoji: area.emoji,
          color: area.color,
          thisMonth: 0,
          lastMonth: 0,
        });
      }
    }),
  );

  return result;
}

export interface DailyCount {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export async function fetchDailyHeatmap(days = 365): Promise<DailyCount[]> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];

  const allDates: string[] = [];

  await Promise.all(
    AREAS.map(async (area) => {
      const notion = getClient();
      const dbId = process.env[area.dbEnvKey];
      if (!dbId) return;

      try {
        let cursor: string | undefined;
        do {
          const res = await notion.databases.query({
            database_id: dbId,
            filter: { timestamp: "created_time", created_time: { on_or_after: startStr } },
            page_size: 100,
            start_cursor: cursor,
          });
          for (const page of res.results as PageObjectResponse[]) {
            allDates.push(page.created_time.split("T")[0]);
          }
          cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
        } while (cursor);
      } catch {
        // skip
      }
    }),
  );

  const countMap: Record<string, number> = {};
  for (const d of allDates) {
    countMap[d] = (countMap[d] || 0) + 1;
  }

  // Fill all days in range
  const result: DailyCount[] = [];
  const cursor = new Date(startDate);
  while (cursor <= now) {
    const key = cursor.toISOString().split("T")[0];
    result.push({ date: key, count: countMap[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

// ── 감정 흐름 데이터 ─────────────────────────────────────────────

export async function fetchSentimentTrend(days = 30): Promise<SentimentRecord[]> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];

  const records: SentimentRecord[] = [];

  await Promise.all(
    AREAS.map(async (area) => {
      const notion = getClient();
      const dbId = process.env[area.dbEnvKey];
      if (!dbId) return;

      try {
        const res = await notion.databases.query({
          database_id: dbId,
          filter: { timestamp: "created_time", created_time: { on_or_after: startStr } },
          sorts: [{ timestamp: "created_time", direction: "ascending" }],
          page_size: 100,
        });

        for (const page of res.results as PageObjectResponse[]) {
          const label = extractSelect(page, "감정");
          if (!label) continue;
          const intensity = extractNumber(page, "감정 강도") ?? 3;
          const emotion = extractText(page, "감정 상세") ?? "";
          records.push({
            date: page.created_time.split("T")[0],
            label: label as SentimentRecord["label"],
            intensity,
            emotion,
            area: area.key,
            title: extractTitle(page),
          });
        }
      } catch {
        // skip
      }
    }),
  );

  records.sort((a, b) => a.date.localeCompare(b.date));
  return records;
}

// ── 관계 네트워크 데이터 ─────────────────────────────────────────

export async function fetchRelationNetwork(): Promise<RelationNode[]> {
  const notion = getClient();
  const dbId = process.env.NOTION_GWANGYE_DB_ID;
  if (!dbId) return [];

  try {
    let cursor: string | undefined;
    const peopleMap: Record<string, { count: number; lastContact: string }> = {};

    do {
      const res = await notion.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: 100,
        start_cursor: cursor,
      });

      for (const page of res.results as PageObjectResponse[]) {
        const name = extractTitle(page);
        if (!name || name === "제목 없음") continue;
        const created = page.created_time.split("T")[0];
        if (!peopleMap[name]) {
          peopleMap[name] = { count: 0, lastContact: created };
        }
        peopleMap[name].count += 1;
        if (created > peopleMap[name].lastContact) {
          peopleMap[name].lastContact = created;
        }
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);

    return Object.entries(peopleMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

// ── 이룸 포인트 트렌드 ──────────────────────────────────────────

export async function fetchAchievementTrend(weeks = 12): Promise<AchievementTrend[]> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - weeks * 7);
  const startStr = startDate.toISOString().split("T")[0];

  const notion = getClient();
  const dbId = process.env.NOTION_IRUM_DB_ID;
  if (!dbId) return [];

  try {
    const res = await notion.databases.query({
      database_id: dbId,
      filter: { timestamp: "created_time", created_time: { on_or_after: startStr } },
      sorts: [{ timestamp: "created_time", direction: "ascending" }],
      page_size: 100,
    });

    // Build week buckets
    const weekStarts: Date[] = [];
    const cur = new Date(startDate);
    const day = cur.getDay();
    cur.setDate(cur.getDate() - (day === 0 ? 6 : day - 1));
    cur.setHours(0, 0, 0, 0);

    while (cur <= now) {
      weekStarts.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }

    const result: AchievementTrend[] = weekStarts.map((ws) => ({
      week: `${ws.getMonth() + 1}/${ws.getDate()}`,
      points: 0,
      count: 0,
    }));

    for (const page of res.results as PageObjectResponse[]) {
      const d = new Date(page.created_time);
      const points = extractNumber(page, "포인트") ?? 1;
      for (let i = weekStarts.length - 1; i >= 0; i--) {
        if (d >= weekStarts[i]) {
          result[i].points += points;
          result[i].count += 1;
          break;
        }
      }
    }

    return result;
  } catch {
    return [];
  }
}

export async function fetchAchievements(
  limit = 20,
  startDate?: string | null,
): Promise<Achievement[]> {
  const notion = getClient();
  const dbId = process.env.NOTION_IRUM_DB_ID;
  if (!dbId) return [];

  const filter = buildDateFilter(startDate);

  try {
    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: limit,
      ...(filter ? { filter } : {}),
    });

    return (res.results as PageObjectResponse[]).map((page) => ({
      ...toRecord(page),
      size: extractSelect(page, "크기") as Achievement["size"],
      area: extractSelect(page, "영역"),
      points: extractNumber(page, "포인트"),
    }));
  } catch {
    return [];
  }
}
