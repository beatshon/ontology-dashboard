export const runtime = "edge";

import { notFound } from "next/navigation";
import Link from "next/link";
import { AREAS, fetchAllAreaRecords } from "@/lib/notion";
import type { NotionRecord } from "@/types";

export const revalidate = 300;

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function groupByMonth(records: NotionRecord[]): Map<string, NotionRecord[]> {
  const groups = new Map<string, NotionRecord[]>();
  for (const r of records) {
    const dateStr = r.date || r.createdAt;
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  return groups;
}

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key: rawKey } = await params;
  const decodedKey = decodeURIComponent(rawKey);
  const area = AREAS.find((a) => a.key === decodedKey);
  if (!area) notFound();

  const records = await fetchAllAreaRecords(area);
  const grouped = groupByMonth(records);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 sm:px-6">
      {/* 헤더 */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          ← 대시보드로 돌아가기
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-3xl">{area.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{area.label}</h1>
            <p className="text-sm text-[#555]">총 {records.length}개 기록</p>
          </div>
        </div>
        <div
          className="h-1 rounded-full mt-4"
          style={{ backgroundColor: area.color, opacity: 0.6 }}
        />
      </div>

      {/* 월별 타임라인 */}
      {records.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 text-center">
          <p className="text-[#444]">아직 기록이 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(grouped.entries()).map(([month, items]) => (
            <section key={month}>
              <h2 className="text-sm font-semibold text-[#666] mb-3 sticky top-0 bg-[#0d0d0d] py-2 z-10">
                {month}
                <span className="ml-2 text-[#444]">({items.length})</span>
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((r) => (
                  <div
                    key={r.id}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-colors"
                    style={{ borderLeftColor: area.color, borderLeftWidth: 3 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#e5e5e5] font-medium leading-snug">
                          {r.title}
                        </p>
                        {r.content && (
                          <p className="text-xs text-[#555] mt-1.5 line-clamp-3">
                            {r.content}
                          </p>
                        )}
                        {r.category && (
                          <span
                            className="inline-block text-[11px] mt-2 px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: area.color + "18",
                              color: area.color,
                            }}
                          >
                            {r.category}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#444] flex-shrink-0 mt-0.5">
                        {formatDate(r.date || r.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
