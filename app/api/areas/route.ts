export const runtime = "edge";

import { AREAS, fetchAreaData } from "@/lib/notion";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const period = url.searchParams.get("start") || undefined;

  try {
    // 3개씩 병렬
    const b1 = await Promise.all(AREAS.slice(0, 3).map((a) => fetchAreaData(a, 5, period)));
    await delay(400);
    const b2 = await Promise.all(AREAS.slice(3, 6).map((a) => fetchAreaData(a, 5, period)));
    await delay(400);
    const b3 = await Promise.all(AREAS.slice(6).map((a) => fetchAreaData(a, 5, period)));

    return Response.json([...b1, ...b2, ...b3], { headers: CACHE_HEADERS });
  } catch {
    return Response.json([]);
  }
}
