export const runtime = "edge";
import { fetchSentimentTrend } from "@/lib/notion";

export async function GET() {
  try {
    const data = await fetchSentimentTrend(30);
    return Response.json(data);
  } catch {
    return Response.json([]);
  }
}
