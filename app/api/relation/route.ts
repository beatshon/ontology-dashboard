export const runtime = "edge";
import { fetchRelationNetwork } from "@/lib/notion";

export async function GET() {
  try {
    const data = await fetchRelationNetwork();
    return Response.json(data);
  } catch {
    return Response.json([]);
  }
}
