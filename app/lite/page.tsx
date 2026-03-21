export const runtime = "edge";
// 5분 캐시
export const revalidate = 300;

import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { AREAS } from "@/lib/areas";

function getClient() {
  return new Client({ auth: process.env.NOTION_TOKEN });
}

function extractTitle(page: PageObjectResponse): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return prop.title[0].plain_text;
    }
  }
  return "";
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function LiteDashboard() {
  const notion = getClient();
  const now = new Date();
  const todayStr = now.toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  // 이번 주 월요일
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  const mondayStr = monday.toISOString().split("T")[0];

  // 영역별 데이터 수집 (3개씩 병렬)
  type AreaStat = { key: string; emoji: string; color: string; count: number; recent: string[] };
  const areas: AreaStat[] = [];

  for (let i = 0; i < AREAS.length; i += 3) {
    const batch = AREAS.slice(i, i + 3);
    const results = await Promise.all(
      batch.map(async (area) => {
        const dbId = process.env[area.dbEnvKey];
        if (!dbId) return { key: area.key, emoji: area.emoji, color: area.color, count: 0, recent: [] as string[] };
        try {
          const res = await notion.databases.query({
            database_id: dbId,
            filter: { timestamp: "created_time", created_time: { on_or_after: mondayStr } },
            sorts: [{ timestamp: "created_time", direction: "descending" }],
            page_size: 5,
          });
          const titles = res.results.map((p) => extractTitle(p as PageObjectResponse)).filter(Boolean);
          return { key: area.key, emoji: area.emoji, color: area.color, count: res.results.length, recent: titles.slice(0, 3) };
        } catch {
          return { key: area.key, emoji: area.emoji, color: area.color, count: 0, recent: [] as string[] };
        }
      })
    );
    areas.push(...results);
    if (i + 3 < AREAS.length) await delay(400);
  }

  const totalWeek = areas.reduce((s, a) => s + a.count, 0);

  // 감정 데이터 (간단히)
  await delay(500);
  let sentimentSummary = { positive: 0, negative: 0, neutral: 0 };
  try {
    for (const area of AREAS.slice(0, 3)) {
      const dbId = process.env[area.dbEnvKey];
      if (!dbId) continue;
      const res = await notion.databases.query({
        database_id: dbId,
        filter: { timestamp: "created_time", created_time: { on_or_after: mondayStr } },
        page_size: 50,
      });
      for (const page of res.results as PageObjectResponse[]) {
        const prop = page.properties["감정"];
        if (prop?.type === "select" && prop.select?.name) {
          if (prop.select.name === "긍정") sentimentSummary.positive++;
          else if (prop.select.name === "부정") sentimentSummary.negative++;
          else sentimentSummary.neutral++;
        }
      }
    }
  } catch { /* skip */ }

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <title>온톨로지 대시보드</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #0d0d0d; color: #e5e5e5; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
          .header h1 { font-size: 24px; font-weight: bold; color: white; }
          .header .date { font-size: 11px; color: #555; }
          .header .sub { font-size: 12px; color: #555; margin-top: 4px; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; margin-bottom: 20px; }
          .summary-card { background: #1a1a1a; border-radius: 12px; padding: 14px; text-align: center; }
          .summary-card .num { font-size: 28px; font-weight: bold; color: white; }
          .summary-card .label { font-size: 11px; color: #666; margin-top: 4px; }
          .week-total { background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; }
          .week-total .big { font-size: 48px; font-weight: bold; color: white; }
          .week-total .label { font-size: 13px; color: #666; }
          .areas { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; margin-bottom: 20px; }
          .area-card { background: #1a1a1a; border-radius: 12px; padding: 14px; border-left: 3px solid; }
          .area-card .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .area-card .name { font-size: 14px; font-weight: 600; }
          .area-card .count { font-size: 20px; font-weight: bold; color: white; }
          .area-card .recent { font-size: 11px; color: #555; margin-top: 6px; line-height: 1.6; }
          .area-card .recent-item { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .mood { display: flex; gap: 12px; justify-content: center; background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
          .mood-item { text-align: center; }
          .mood-item .emoji { font-size: 24px; }
          .mood-item .val { font-size: 18px; font-weight: bold; color: white; margin-top: 2px; }
          .mood-item .label { font-size: 10px; color: #666; }
          .refresh { text-align: center; margin-top: 20px; }
          .refresh a { color: #555; font-size: 11px; text-decoration: none; background: #1a1a1a; padding: 8px 16px; border-radius: 8px; }
          @media (max-width: 500px) {
            body { padding: 12px; }
            .header h1 { font-size: 20px; }
            .areas { grid-template-columns: 1fr 1fr; }
            .summary { grid-template-columns: repeat(4, 1fr); }
          }
        `}} />
      </head>
      <body>
        <div className="header">
          <div>
            <h1>온톨로지 대시보드</h1>
            <div className="sub">제이스의 삶의 기록</div>
          </div>
          <div className="date">{todayStr}</div>
        </div>

        {/* 이번 주 총 기록 */}
        <div className="week-total">
          <div className="big">{totalWeek}</div>
          <div className="label">이번 주 기록</div>
        </div>

        {/* 감정 요약 */}
        {(sentimentSummary.positive + sentimentSummary.negative + sentimentSummary.neutral > 0) && (
          <div className="mood">
            <div className="mood-item">
              <div className="emoji">😊</div>
              <div className="val">{sentimentSummary.positive}</div>
              <div className="label">긍정</div>
            </div>
            <div className="mood-item">
              <div className="emoji">😐</div>
              <div className="val">{sentimentSummary.neutral}</div>
              <div className="label">중립</div>
            </div>
            <div className="mood-item">
              <div className="emoji">😔</div>
              <div className="val">{sentimentSummary.negative}</div>
              <div className="label">부정</div>
            </div>
          </div>
        )}

        {/* 영역별 카드 */}
        <div className="areas">
          {areas.map((a) => (
            <div key={a.key} className="area-card" style={{ borderLeftColor: a.color }}>
              <div className="top">
                <span className="name">{a.emoji} {a.key}</span>
                <span className="count">{a.count}</span>
              </div>
              <div className="recent">
                {a.recent.map((t, i) => (
                  <div key={i} className="recent-item">· {t}</div>
                ))}
                {a.recent.length === 0 && <div style={{ color: "#333" }}>기록 없음</div>}
              </div>
            </div>
          ))}
        </div>

        {/* 요약 수치 */}
        <div className="summary">
          {areas.map((a) => (
            <div key={a.key} className="summary-card">
              <div style={{ fontSize: "16px" }}>{a.emoji}</div>
              <div className="num">{a.count}</div>
              <div className="label">{a.key}</div>
            </div>
          ))}
        </div>

        <div className="refresh">
          <a href="/lite">새로고침</a>
        </div>
      </body>
    </html>
  );
}
