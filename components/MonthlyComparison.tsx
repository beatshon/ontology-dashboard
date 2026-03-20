"use client";

import type { MonthlyComparison } from "@/lib/notion";

interface Props {
  data: MonthlyComparison[];
}

function TrendArrow({ thisMonth, lastMonth }: { thisMonth: number; lastMonth: number }) {
  if (lastMonth === 0 && thisMonth === 0) {
    return <span className="text-[#555] text-xs">—</span>;
  }
  if (lastMonth === 0) {
    return <span className="text-emerald-400 text-xs">NEW</span>;
  }

  const diff = thisMonth - lastMonth;
  const pct = Math.round((diff / lastMonth) * 100);

  if (diff > 0) {
    return <span className="text-emerald-400 text-xs">+{pct}% ↑</span>;
  }
  if (diff < 0) {
    return <span className="text-red-400 text-xs">{pct}% ↓</span>;
  }
  return <span className="text-[#555] text-xs">±0%</span>;
}

export default function MonthlyComparisonChart({ data }: Props) {
  const now = new Date();
  const thisMonthLabel = `${now.getMonth() + 1}월`;
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const lastMonthLabel = `${lastMonth}월`;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.thisMonth, d.lastMonth)),
    1,
  );

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest">
          월간 비교
        </h2>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#555] inline-block" />
            <span className="text-[#666]">{lastMonthLabel}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" />
            <span className="text-[#999]">{thisMonthLabel}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {data.map((d) => {
          const lastPct = Math.round((d.lastMonth / maxVal) * 100);
          const thisPct = Math.round((d.thisMonth / maxVal) * 100);

          return (
            <div key={d.area}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#ccc] flex items-center gap-1.5">
                  <span>{d.emoji}</span>
                  <span>{d.area}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#555]">{d.lastMonth}</span>
                  <span className="text-xs text-[#aaa]">→</span>
                  <span className="text-xs text-white font-medium">{d.thisMonth}</span>
                  <TrendArrow thisMonth={d.thisMonth} lastMonth={d.lastMonth} />
                </div>
              </div>
              <div className="relative h-3 bg-[#222] rounded-full overflow-hidden">
                {/* Last month (behind) */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full opacity-30"
                  style={{
                    width: `${lastPct}%`,
                    backgroundColor: d.color,
                  }}
                />
                {/* This month (front) */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${thisPct}%`,
                    backgroundColor: d.color,
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
