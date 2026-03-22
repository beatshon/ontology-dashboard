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

  // 각 영역 DB에서 최신 기록 조회
  // last_edited_time으로 정렬하면 실제 사용자가 편집한 기록이 상위에 옴
  for (const area of AREAS) {
    const dbId = process.env[area.dbEnvKey];
    if (!dbId) continue;

    try {
      const res = await notion.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        page_size: 5,
      });

      for (const page of res.results as PageObjectResponse[]) {
        const title = extractTitle(page);
        if (!title) continue;

        // 이미 같은 제목이 있으면 스킵 (중복 방지)
        if (entries.some((e) => e.title === title)) continue;

        const dateStr = page.last_edited_time.slice(0, 10);

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

    await new Promise((r) => setTimeout(r, 400));
  }

  // 최신순 정렬 후 상위 6개만 반환
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return Response.json({
    entries: entries.slice(0, 6),
    total: entries.length,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
