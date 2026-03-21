export const runtime = "edge";

import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const PHOTO_BASE = "https://dayone-photos.pages.dev";

interface MapEntry {
  uuid: string;
  text: string;
  date: string | null;
  hasPhoto: boolean;
  location: string | null;
}

interface DayOneEntry {
  title: string;
  area: string;
  date: string;
  sentiment: string | null;
  emotion: string | null;
  content: string;
  url: string;
  location: string | null;
  photoUrl: string | null;
}

export async function GET(request: Request) {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  // 정적 매핑 파일 로드
  const origin = new URL(request.url).origin;
  let dayoneMap: MapEntry[] = [];
  try {
    const mapRes = await fetch(`${origin}/dayone-map.json`);
    dayoneMap = await mapRes.json();
  } catch {
    // skip
  }

  // 본문 앞 50자 → UUID+사진+날짜+위치 매핑
  const textToMeta = new Map<string, MapEntry>();
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
  const importDate = "2026-03-21";

  // 순차 실행 + 딜레이로 rate limit 대응
  for (const [area, dbId] of dbIds) {
    if (!dbId) continue;

    try {
      const res = await notion.databases.query({
        database_id: dbId,
        filter: {
          timestamp: "created_time",
          created_time: { equals: importDate },
        },
        page_size: 100,
      });

      const count = res.results.length;
      if (count > 0) byArea[area] = count;

      for (const page of res.results as PageObjectResponse[]) {
        if (entries.length >= 30) break; // 대시보드 표시 제한

        const props = page.properties;

        // 제목 추출
        let title = "";
        for (const prop of Object.values(props)) {
          if (prop.type === "title" && prop.title.length > 0) {
            title = prop.title[0].plain_text;
            break;
          }
        }
        if (!title) continue;

        // 감정
        const sentimentProp = props["감정"];
        const sentiment =
          sentimentProp?.type === "select" && sentimentProp.select?.name
            ? sentimentProp.select.name
            : null;

        const emotionProp = props["감정 상세"];
        const emotion =
          emotionProp?.type === "rich_text" && emotionProp.rich_text.length > 0
            ? emotionProp.rich_text[0].plain_text
            : null;

        // 본문 첫 블록 가져오기 (사진 매칭용)
        let content = "";
        let contentKey = "";
        try {
          const blocks = await notion.blocks.children.list({
            block_id: page.id,
            page_size: 2,
          });
          for (const block of blocks.results) {
            if ("type" in block && block.type === "paragraph") {
              const text = block.paragraph.rich_text
                .map((t: { plain_text: string }) => t.plain_text)
                .join("");
              if (text && !text.startsWith("📍") && !text.startsWith("🌤") && !text.startsWith("📌")) {
                content = text;
                contentKey = text.slice(0, 50);
                break;
              }
            }
          }
        } catch {
          // skip
        }

        // 매핑에서 사진/날짜/위치 조회
        const meta = textToMeta.get(contentKey);
        const photoUrl = meta?.hasPhoto ? `${PHOTO_BASE}/${meta.uuid}.jpg` : null;
        const originalDate = meta?.date || importDate;
        const location = meta?.location || null;

        entries.push({
          title,
          area,
          date: originalDate,
          sentiment,
          emotion,
          content: content.slice(0, 150),
          url: page.url,
          location,
          photoUrl,
        });
      }
    } catch {
      // rate limit 등 — 해당 영역 스킵
    }

    // rate limit 대응
    await new Promise((r) => setTimeout(r, 500));
  }

  // 날짜순 정렬 (최신순)
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return Response.json({
    total: Object.values(byArea).reduce((s, v) => s + v, 0),
    byArea,
    entries,
  });
}
