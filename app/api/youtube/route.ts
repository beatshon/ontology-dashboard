export const runtime = "edge";

import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const CHANNELS: Record<string, { dbId: string; emoji: string }> = {
  "그럴 만해": { dbId: "18a4948cc4554b4aa56b165ec4182835", emoji: "🌿" },
  "달빛 에세이": { dbId: "368df93daacb49508e84d3ceb0fec60c", emoji: "🌙" },
};

export async function GET() {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  const channels: {
    name: string;
    emoji: string;
    date: string;
    subscribers: string;
    views: string;
    videos: string;
    best: string;
  }[] = [];

  for (const [name, config] of Object.entries(CHANNELS)) {
    try {
      const res = await notion.databases.query({
        database_id: config.dbId,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: 1,
      });

      if (!res.results.length) continue;

      const page = res.results[0] as PageObjectResponse;
      const date = page.created_time.slice(0, 10);

      // 페이지 본문에서 통계 추출
      const blocks = await notion.blocks.children.list({
        block_id: page.id,
        page_size: 10,
      });

      let subscribers = "";
      let views = "";
      let videos = "";
      let best = "";

      for (const block of blocks.results) {
        if ("type" in block && block.type === "callout") {
          const text = block.callout.rich_text
            .map((t: { plain_text: string }) => t.plain_text)
            .join("");
          if (text.includes("구독자")) {
            const parts = text.split("|");
            for (const p of parts) {
              const trimmed = p.trim();
              if (trimmed.includes("구독자")) subscribers = trimmed;
              else if (trimmed.includes("조회수")) views = trimmed;
              else if (trimmed.includes("영상")) videos = trimmed;
            }
          } else if (text.includes("베스트")) {
            best = text.replace("🏆 베스트:", "").trim();
          }
        }
      }

      channels.push({ name, emoji: config.emoji, date, subscribers, views, videos, best });
    } catch {
      // skip
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return Response.json({ channels }, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
  });
}
