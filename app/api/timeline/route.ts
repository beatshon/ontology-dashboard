export const runtime = "edge";

import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { AREAS } from "@/lib/areas";

function extractTitle(page: PageObjectResponse): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return prop.title[0].plain_text;
    }
  }
  return "";
}

function extractFirstRichText(page: PageObjectResponse): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "rich_text" && prop.rich_text.length > 0) {
      return prop.rich_text[0].plain_text;
    }
  }
  return "";
}

function extractSelect(page: PageObjectResponse, key: string): string | null {
  const prop = page.properties[key];
  if (prop?.type === "select" && prop.select?.name) {
    return prop.select.name;
  }
  return null;
}

export async function GET() {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  const entries: {
    title: string;
    area: string;
    emoji: string;
    date: string;
    sentiment: string | null;
    content: string;
    url: string;
  }[] = [];

  // 각 영역 DB에서 최근 3건씩 조회 (순차, rate limit 대응)
  for (const area of AREAS) {
    const dbId = process.env[area.dbEnvKey];
    if (!dbId) continue;

    try {
      const res = await notion.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: 3,
      });

      for (const page of res.results as PageObjectResponse[]) {
        const title = extractTitle(page);
        if (!title) continue;

        const created = page.created_time;
        const dateStr = created.slice(0, 10);

        // Day One 대량 임포트 데이터 제외
        // 2026-03-21에 생성되고 created_time ≈ last_edited_time이면 임포트된 것
        const editedMs = new Date(page.last_edited_time).getTime();
        const createdMs = new Date(created).getTime();
        if (dateStr === "2026-03-21" && Math.abs(editedMs - createdMs) < 60000) continue;

        entries.push({
          title,
          area: area.key,
          emoji: area.emoji,
          date: dateStr,
          sentiment: extractSelect(page, "감정"),
          content: extractFirstRichText(page).slice(0, 100),
          url: page.url,
        });
      }
    } catch {
      // skip
    }

    // rate limit 대응
    await new Promise((r) => setTimeout(r, 350));
  }

  // 최신순 정렬 후 상위 6개만 반환
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return Response.json({
    entries: entries.slice(0, 6),
    total: entries.length,
  });
}
