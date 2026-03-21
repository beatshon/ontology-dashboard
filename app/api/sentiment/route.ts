export const runtime = "edge";
import { fetchSentimentTrend } from "@/lib/notion";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET() {
  try {
    const data = await fetchSentimentTrend(30);
    return Response.json(data, { headers: CACHE_HEADERS });
  } catch {
    return Response.json([]);
  }
}
