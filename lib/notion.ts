import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { AreaConfig, AreaData, Achievement, NotionRecord } from "@/types";

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

export async function fetchAreaData(area: AreaConfig, limit = 5): Promise<AreaData> {
  const notion = getClient();
  const dbId = process.env[area.dbEnvKey];
  if (!dbId) return { area, records: [], total: 0 };

  try {
    const [recent, all] = await Promise.all([
      notion.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: limit,
      }),
      notion.databases.query({ database_id: dbId, page_size: 100 }),
    ]);

    const records = (recent.results as PageObjectResponse[]).map(toRecord);
    return { area, records, total: all.results.length };
  } catch {
    return { area, records: [], total: 0 };
  }
}

export async function fetchAchievements(limit = 20): Promise<Achievement[]> {
  const notion = getClient();
  const dbId = process.env.NOTION_IRUM_DB_ID;
  if (!dbId) return [];

  try {
    const res = await notion.databases.query({
      database_id: dbId,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: limit,
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
