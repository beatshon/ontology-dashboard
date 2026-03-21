"use client";

import type { RelationNode } from "@/types";

interface Props {
  data: RelationNode[];
}

export default function RelationNetwork({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-6">
        <h2 className="text-lg font-bold mb-4">🤝 관계 네트워크</h2>
        <p className="text-gray-500 text-sm">아직 관계 기록이 없어요.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));
  const today = new Date().toISOString().split("T")[0];
  const totalRecords = data.reduce((sum, d) => sum + d.count, 0);

  function recencyLabel(lastContact: string): { text: string; color: string; bgColor: string } {
    const daysSince = Math.floor(
      (new Date(today).getTime() - new Date(lastContact).getTime()) / 86400000
    );
    if (daysSince === 0) return { text: "오늘", color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
    if (daysSince <= 7) return { text: `${daysSince}일 전`, color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
    if (daysSince <= 30) return { text: `${daysSince}일 전`, color: "text-blue-400", bgColor: "bg-blue-500/20" };
    if (daysSince <= 90) return { text: `${daysSince}일 전`, color: "text-amber-400", bgColor: "bg-amber-500/20" };
    return { text: `${daysSince}일 전`, color: "text-red-400", bgColor: "bg-red-500/20" };
  }

  function barColor(lastContact: string): string {
    const daysSince = Math.floor(
      (new Date(today).getTime() - new Date(lastContact).getTime()) / 86400000
    );
    if (daysSince <= 7) return "bg-emerald-500";
    if (daysSince <= 30) return "bg-blue-500";
    if (daysSince <= 90) return "bg-amber-500";
    return "bg-red-500/60";
  }

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-6">
      {/* 헤더 */}
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-bold">🤝 관계 네트워크</h2>
        <span className="text-xs text-gray-500">{totalRecords}건의 기록</span>
      </div>
      <p className="text-xs text-gray-500 mb-5">{data.length}명과의 만남</p>

      {/* 사람별 리스트 */}
      <div className="space-y-3">
        {data.slice(0, 12).map((person, i) => {
          const barWidth = Math.round((person.count / maxCount) * 100);
          const recency = recencyLabel(person.lastContact);

          return (
            <div key={person.name} className="group">
              <div className="flex items-center gap-3">
                {/* 순위 */}
                <span className="text-[10px] text-gray-600 w-4 text-right">{i + 1}</span>

                {/* 이름 */}
                <span className="text-sm font-medium text-gray-200 w-20 truncate">
                  {person.name}
                </span>

                {/* 바 */}
                <div className="flex-1 h-5 bg-[#262626] rounded overflow-hidden relative">
                  <div
                    className={`h-full rounded ${barColor(person.lastContact)} transition-all`}
                    style={{ width: `${barWidth}%` }}
                  />
                  <span className="absolute right-2 top-0.5 text-[10px] text-gray-400">
                    {person.count}건
                  </span>
                </div>

                {/* 마지막 연락 */}
                <span className={`text-[10px] ${recency.color} ${recency.bgColor} px-1.5 py-0.5 rounded w-16 text-center shrink-0`}>
                  {recency.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex justify-center gap-4 mt-5 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500" />
          7일 이내
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-blue-500" />
          30일 이내
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-amber-500" />
          90일 이내
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-red-500/60" />
          90일+
        </span>
      </div>
    </div>
  );
}
