export const runtime = "edge";
export const revalidate = 0;

import { Client } from "@notionhq/client";

export default async function DebugPage() {
  const token = process.env.NOTION_TOKEN;
  const naDbId = process.env.NOTION_NA_DB_ID;

  if (!token || !naDbId) {
    return <pre style={{ color: "white", padding: 20 }}>MISSING: token={!!token} na={!!naDbId}</pre>;
  }

  const notion = new Client({ auth: token });

  let result = "";
  try {
    const res = await notion.databases.query({
      database_id: naDbId,
      page_size: 3,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const pages = res.results as any[];
    result = JSON.stringify({
      count: pages.length,
      props: pages.length > 0 ? Object.keys(pages[0].properties) : [],
      sentiment: pages.map(p => ({
        title: p.properties["이름"]?.title?.[0]?.plain_text || "?",
        emotion: p.properties["감정"]?.select?.name || "NONE",
        intensity: p.properties["감정 강도"]?.number ?? "NONE",
      })),
    }, null, 2);
  } catch (e: any) {
    result = `ERROR: ${e.message}\n${e.code || ""}\n${e.status || ""}`;
  }

  return <pre style={{ color: "lime", padding: 20, background: "#111" }}>{result}</pre>;
}
