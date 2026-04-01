export const runtime = "edge";

import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { AREAS } from "@/lib/areas";

function extractTitle(page: PageObjectResponse): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }
  return "";
}

function extractFirstRichText(page: PageObjectResponse): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "rich_text" && prop.rich_text.length > 0) {
      return prop.rich_text.map((t) => t.plain_text).join("");
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

function extractCreatedDate(page: PageObjectResponse): string {
  // 1. Try explicit date property
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "date" && prop.date?.start) {
      return prop.date.start.slice(0, 10);
    }
  }
  // 2. Fallback to created_time
  return page.created_time.slice(0, 10);
}

export interface OnThisDayEntry {
  title: string;
  area: string;
  emoji: string;
  date: string;
  yearsAgo: number;
  sentiment: string | null;
  content: string;
  url: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date"); // optional: YYYY-MM-DD

  const today = dateParam ? new Date(dateParam) : new Date();
  const month = today.getMonth() + 1; // 1-indexed
  const day = today.getDate();
  const currentYear = today.getFullYear();

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const entries: OnThisDayEntry[] = [];

  // Query each area DB for records created on this day in previous years
  for (const area of AREAS) {
    const dbId = process.env[area.dbEnvKey];
    if (!dbId) continue;

    try {
      // Notion doesn't support "same month/day" filter directly,
      // so we query broadly and filter client-side
      // Use created_time filter for each past year
      const yearsToCheck = [1, 2, 3]; // Check 1-3 years ago

      for (const yearsAgo of yearsToCheck) {
        const targetYear = currentYear - yearsAgo;
        const targetDate = `${targetYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const nextDate = new Date(targetYear, month - 1, day + 1);
        const nextDateStr = nextDate.toISOString().slice(0, 10);

        const res = await notion.databases.query({
          database_id: dbId,
          filter: {
            and: [
              {
                timestamp: "created_time",
                created_time: { on_or_after: targetDate },
              },
              {
                timestamp: "created_time",
                created_time: { before: nextDateStr },
              },
            ],
          },
          page_size: 5,
        });

        for (const page of res.results as PageObjectResponse[]) {
          const title = extractTitle(page);
          if (!title) continue;

          entries.push({
            title,
            area: area.key,
            emoji: area.emoji,
            date: extractCreatedDate(page),
            yearsAgo,
            sentiment: extractSelect(page, "감정"),
            content: extractFirstRichText(page).slice(0, 200),
            url: page.url,
          });
        }
      }
    } catch {
      // skip failed areas
    }

    // Rate limit: 3 req/sec for Notion API
    await new Promise((r) => setTimeout(r, 400));
  }

  // Sort by yearsAgo (most recent first), then by area
  entries.sort((a, b) => a.yearsAgo - b.yearsAgo || a.area.localeCompare(b.area));

  return Response.json(
    {
      date: `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      entries,
      total: entries.length,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}
