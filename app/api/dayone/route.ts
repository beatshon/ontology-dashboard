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

  // 모든 DB에서 최근 기록 조회 (last_edited_time 기준)
  for (const [area, dbId] of dbIds) {
    if (!dbId) continue;

    try {
      const res = await notion.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        page_size: 10,
      });

      for (const page of res.results as PageObjectResponse[]) {
        const title = extractTitle(page);
        if (!title) continue;

        // 이미 같은 제목이 있으면 스킵
        if (entries.some((e) => e.title === title)) continue;

        const sentiment = extractSelect(page, "감정");

        // 본문 첫 블록 가져오기
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
                // Notion에 저장된 이미지
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

        // 정적 매핑에서 사진 URL 보완
        if (!photoUrl && contentKey) {
          const meta = textToMeta.get(contentKey);
          if (meta?.hasPhoto) {
            photoUrl = `${PHOTO_BASE}/${meta.uuid}.jpg`;
          }
        }

        const dateStr = page.last_edited_time.slice(0, 10);
        byArea[area] = (byArea[area] || 0) + 1;

        entries.push({
          title,
          area,
          date: dateStr,
          sentiment,
          content: content.slice(0, 150),
          url: page.url,
          location,
          photoUrl,
        });
      }
    } catch { /* skip */ }

    await new Promise((r) => setTimeout(r, 400));
  }

  // 날짜순 정렬 (최신순)
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return Response.json({
    total: entries.length,
    byArea,
    entries: entries.slice(0, 30),
  });
}
