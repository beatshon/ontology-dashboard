export const runtime = "edge";
import { fetchAchievementTrend } from "@/lib/notion";

export async function GET() {
  try {
    const data = await fetchAchievementTrend(12);
    return Response.json(data);
  } catch {
    return Response.json([]);
  }
}
