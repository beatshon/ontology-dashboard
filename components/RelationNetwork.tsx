"use client";

import { useState } from "react";
import type { RelationNode } from "@/types";

interface Props {
  data: RelationNode[];
}

type CategoryFilter = "전체" | "가족" | "동료" | "친구" | "멘토" | "클라이언트";

const CATEGORY_FILTERS: CategoryFilter[] = ["전체", "가족", "동료", "친구", "멘토", "클라이언트"];

const CATEGORY_BADGE_STYLE: Record<string, string> = {
  가족: "bg-rose-500/20 text-rose-400",
  동료: "bg-blue-500/20 text-blue-400",
  친구: "bg-emerald-500/20 text-emerald-400",
  멘토: "bg-purple-500/20 text-purple-400",
  클라이언트: "bg-amber-500/20 text-amber-400",
};

function getRecencyLabel(lastContact: string): { text: string; color: string; bgColor: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - new Date(lastContact).getTime()) / 86400000);

  if (daysSince === 0) return { text: "오늘", color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
  if (daysSince <= 7) return { text: `${daysSince}일 전`, color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
  if (daysSince <= 30) return { text: `${daysSince}일 전`, color: "text-blue-400", bgColor: "bg-blue-500/20" };
  if (daysSince <= 90) return { text: `${daysSince}일 전`, color: "text-amber-400", bgColor: "bg-amber-500/20" };
  return { text: `${daysSince}일 전`, color: "text-red-400", bgColor: "bg-red-500/20" };
}

function getSentimentIcon(avgSentiment: number): string {
  if (avgSentiment > 0.2) return "😊";
  if (avgSentiment < -0.2) return "😟";
  return "😐";
}

function getStrengthBarColor(score: number): string {
  if (score >= 0.7) return "bg-emerald-500";
  if (score >= 0.4) return "bg-blue-500";
  if (score >= 0.2) return "bg-amber-500";
  return "bg-red-500/60";
}

function SummaryStats({ data }: { data: RelationNode[] }) {
  const totalCount = data.length;
  const activeCount = data.filter((d) => {
    const daysSince = Math.floor(
      (new Date().getTime() - new Date(d.lastContact).getTime()) / 86400000
    );
    return daysSince <= 30;
  }).length;
  const cautionCount = data.filter((d) => d.isDrifting || d.strengthScore < 0.2).length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      <div className="bg-[#262626] rounded-xl p-3 text-center">
        <div className="text-xl font-bold text-white">{totalCount}</div>
        <div className="text-[10px] text-gray-500 mt-0.5">총 인맥</div>
      </div>
      <div className="bg-[#262626] rounded-xl p-3 text-center">
        <div className="text-xl font-bold text-emerald-400">{activeCount}</div>
        <div className="text-[10px] text-gray-500 mt-0.5">활발한 관계</div>
      </div>
      <div className="bg-[#262626] rounded-xl p-3 text-center">
        <div className="text-xl font-bold text-amber-400">{cautionCount}</div>
        <div className="text-[10px] text-gray-500 mt-0.5">주의 필요</div>
      </div>
    </div>
  );
}

function CategoryFilterBar({
  selected,
  onSelect,
}: {
  selected: CategoryFilter;
  onSelect: (f: CategoryFilter) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      {CATEGORY_FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => onSelect(filter)}
          className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
            selected === filter
              ? "bg-white text-black font-medium"
              : "bg-[#262626] text-gray-400 hover:bg-[#333] hover:text-gray-200"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function PersonCard({ person, rank }: { person: RelationNode; rank: number }) {
  const recency = getRecencyLabel(person.lastContact);
  const strengthPct = Math.round(person.strengthScore * 100);
  const barColor = getStrengthBarColor(person.strengthScore);
  const sentimentIcon = getSentimentIcon(person.avgSentiment);
  const categoryStyle = person.category
    ? (CATEGORY_BADGE_STYLE[person.category] ?? "bg-gray-500/20 text-gray-400")
    : null;

  return (
    <div className="group bg-[#1f1f1f] hover:bg-[#252525] rounded-xl p-3 transition-colors">
      {/* 상단 행: 순위 + 이름 + 감정아이콘 + 드리프트경고 + 카테고리 + 마지막연락 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-gray-600 w-4 text-right shrink-0">{rank}</span>

        <span className="text-sm font-medium text-gray-200 truncate flex-1">
          {person.name}
        </span>

        <span className="text-sm" title={`감정 평균: ${person.avgSentiment.toFixed(2)}`}>
          {sentimentIcon}
        </span>

        {person.isDrifting && (
          <span className="text-sm" title="드리프트 경고: 오래 연락 안 함 + 부정 감정">
            ⚠️
          </span>
        )}

        {categoryStyle && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryStyle} shrink-0`}>
            {person.category}
          </span>
        )}

        <span
          className={`text-[10px] ${recency.color} ${recency.bgColor} px-1.5 py-0.5 rounded shrink-0`}
        >
          {recency.text}
        </span>
      </div>

      {/* 강도 게이지 바 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500 w-4 text-right shrink-0">{person.count}건</span>
        <div className="flex-1 h-1.5 bg-[#333] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${strengthPct}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500 w-8 text-right shrink-0">
          {strengthPct}%
        </span>
      </div>
    </div>
  );
}

export default function RelationNetwork({ data }: Props) {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("전체");

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-6">
        <h2 className="text-lg font-bold mb-4">🤝 관계 네트워크</h2>
        <p className="text-gray-500 text-sm">아직 관계 기록이 없어요.</p>
      </div>
    );
  }

  const filteredData =
    activeFilter === "전체"
      ? data
      : data.filter((d) => d.category === activeFilter);

  const totalRecords = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-6">
      {/* 헤더 */}
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-bold">🤝 관계 네트워크</h2>
        <span className="text-xs text-gray-500">{totalRecords}건의 기록</span>
      </div>
      <p className="text-xs text-gray-500 mb-5">{data.length}명과의 만남</p>

      {/* 요약 통계 */}
      <SummaryStats data={data} />

      {/* 카테고리 필터 */}
      <CategoryFilterBar selected={activeFilter} onSelect={setActiveFilter} />

      {/* 사람별 카드 */}
      {filteredData.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-4">
          해당 카테고리의 관계 기록이 없어요.
        </p>
      ) : (
        <div className="space-y-2">
          {filteredData.slice(0, 12).map((person, i) => (
            <PersonCard key={person.name} person={person} rank={i + 1} />
          ))}
        </div>
      )}

      {/* 범례 */}
      <div className="flex flex-wrap justify-center gap-3 mt-5 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500" />
          강도 높음 (70%+)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-blue-500" />
          보통 (40%+)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-amber-500" />
          약함 (20%+)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-red-500/60" />
          매우 약함
        </span>
      </div>
    </div>
  );
}
