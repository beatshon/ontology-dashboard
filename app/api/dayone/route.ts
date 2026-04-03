export const runtime = "edge";

import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const PHOTO_BASE = "https://dayone-photos.pages.dev";

interface DayOneEntry {
  title: string;
  area: string;
  date: string;
  sentiment: string | null;
  content: string;
  url: string;
  location: string | null;
  photoUrl: string | null;
}

function extractTitle(page: PageObjectResponse): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return prop.title[0].plain_text;
    }
  }
  return "";
}

function extractSelect(page: PageObjectResponse, key: string): string | null {
  const prop = (page.properties as Record<string, { type: string; select?: { name: string } | null }>)[key];
  if (prop?.type === "select" && prop.select?.name) return prop.select.name;
  return null;
}

export async function GET(request: Request) {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const origin = new URL(request.url).origin;

  // 정적 매핑 파일 로드 (사진 ID 매칭용)
  let dayoneMap: { uuid: string; text: string; hasPhoto: boolean; date: string | null; location: string | null }[] = [];
  try {
    const mapRes = await fetch(`${origin}/dayone-map.json`);
    dayoneMap = await mapRes.json();
  } catch { /* skip */ }

  const textToMeta = new Map<string, typeof dayoneMap[0]>();
  for (const m of dayoneMap) {
    textToMeta.set(m.text, m);
  }

  const dbIds: [string, string | undefined][] = [
    ["나", process.env.NOTION_NA_DB_ID],
    ["일", process.env.NOTION_IL_DB_ID],
    ["관계", process.env.NOTION_GWANGYE_DB_ID],
    ["배움", process.env.NOTION_BAEUM_DB_ID],
    ["건강", process.env.NOTION_GEONGANG_DB_ID],
    ["가족", process.env.NOTION_GAJOK_DB_ID],
    ["경제적 자유", process.env.NOTION_GYEONGJE_DB_ID],
  ];

  const entries: DayOneEntry[] = [];
  const byArea: Record<string, number> = {};

  // 모든 DB를 병렬로 최근 기록 조회 (3개씩 배치)
  const fetchArea = async (area: string, dbId: string) => {
    const areaEntries: DayOneEntry[] = [];
    try {
      const res = await notion.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        page_size: 5,
      });

      // 페이지 목록에서 메타 정보만 먼저 수집
      const pages = (res.results as PageObjectResponse[]).filter(p => extractTitle(p));

      // 블록 조회는 최근 3개만 (속도 우선)
      for (const page of pages.slice(0, 3)) {
        const title = extractTitle(page);
        const sentiment = extractSelect(page, "감정");

        let content = "";
        let contentKey = "";
        let photoUrl: string | null = null;
        let location: string | null = null;

        try {
          const blocks = await notion.blocks.children.list({
            block_id: page.id,
            page_size: 5,
          });
          for (const block of blocks.results) {
            if ("type" in block) {
              if (block.type === "image" && "image" in block) {
                const img = block.image;
                if ("external" in img && img.external?.url) {
                  photoUrl = img.external.url;
                }
              } else if (block.type === "paragraph" && "paragraph" in block) {
                const text = block.paragraph.rich_text
                  .map((t: { plain_text: string }) => t.plain_text)
                  .join("");
                if (text.startsWith("📍")) {
                  location = text.replace("📍 ", "");
                } else if (!content && !text.startsWith("🌤") && !text.startsWith("📌")) {
                  content = text;
                  contentKey = text.slice(0, 50);
                }
              }
            }
          }
        } catch { /* skip */ }

        if (!photoUrl && contentKey) {
          const meta = textToMeta.get(contentKey);
          if (meta?.hasPhoto) {
            photoUrl = `${PHOTO_BASE}/${meta.uuid}.jpg`;
          }
        }

        if (!photoUrl && !location) continue;

        const dateStr = page.last_edited_time.slice(0, 10);
        byArea[area] = (byArea[area] || 0) + 1;

        areaEntries.push({
          title, area, date: dateStr, sentiment,
          content: content.slice(0, 150),
          url: page.url, location, photoUrl,
        });
      }
    } catch { /* skip */ }
    return areaEntries;
  };

  // 4개씩 병렬 배치
  const validDbs = dbIds.filter(([, id]) => id) as [string, string][];
  const batch1 = await Promise.all(validDbs.slice(0, 4).map(([a, id]) => fetchArea(a, id)));
  const batch2 = await Promise.all(validDbs.slice(4).map(([a, id]) => fetchArea(a, id)));
  for (const batch of [...batch1, ...batch2]) {
    for (const e of batch) {
      if (!entries.some((x) => x.title === e.title)) entries.push(e);
    }
  }

  // 날짜순 정렬 (최신순)
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return Response.json({
    total: entries.length,
    byArea,
    entries: entries.slice(0, 30),
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
