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
  const prop = (page.properties as Record<string, { type: string; select?: { name: string } | null }>)[key];
  if (prop?.type === "select" && prop.select?.name) return prop.select.name;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  if (!query) {
    return Response.json({ results: [], total: 0 });
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const results: {
    title: string;
    area: string;
    emoji: string;
    date: string;
    content: string;
    sentiment: string | null;
    url: string;
  }[] = [];

  for (const area of AREAS) {
    const dbId = process.env[area.dbEnvKey];
    if (!dbId) continue;

    try {
      const res = await notion.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: 30,
      });

      for (const page of res.results as PageObjectResponse[]) {
        const title = extractTitle(page);
        const content = extractFirstRichText(page);
        const fullText = `${title} ${content}`.toLowerCase();

        if (fullText.includes(query)) {
          results.push({
            title,
            area: area.key,
            emoji: area.emoji,
            date: page.created_time.slice(0, 10),
            content: content.slice(0, 100),
            sentiment: extractSelect(page, "감정"),
            url: page.url,
          });
        }
      }
    } catch {
      // skip
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  results.sort((a, b) => b.date.localeCompare(a.date));

  return Response.json({
    results: results.slice(0, 20),
    total: results.length,
    query,
  });
}
