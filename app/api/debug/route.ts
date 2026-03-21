export const runtime = "edge";

import { fetchSentimentTrend, fetchRelationNetwork, AREAS } from "@/lib/notion";

export async function GET() {
  const log: string[] = [];

  // 감정 테스트
  try {
    const data = await fetchSentimentTrend(30);
    log.push(`sentiment: ${data.length}건`);
    if (data.length > 0) {
      log.push(`first: ${JSON.stringify(data[0])}`);
    }
  } catch (e: unknown) {
    log.push(`sentiment ERR: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 관계 테스트
  try {
    const data = await fetchRelationNetwork();
    log.push(`relation: ${data.length}건`);
    if (data.length > 0) {
      log.push(`first: ${JSON.stringify(data[0])}`);
    }
  } catch (e: unknown) {
    log.push(`relation ERR: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 환경변수 체크
  log.push(`AREAS env: ${AREAS.map(a => `${a.key}:${process.env[a.dbEnvKey] ? "Y" : "N"}`).join(",")}`);
  log.push(`GWANGYE: ${process.env.NOTION_GWANGYE_DB_ID ? "Y" : "N"}`);

  return Response.json({ log });
}
