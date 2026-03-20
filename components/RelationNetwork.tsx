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

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-6">
      <h2 className="text-lg font-bold mb-1">🤝 관계 네트워크</h2>
      <p className="text-xs text-gray-500 mb-4">{data.length}명과의 기록</p>

      {/* Bubble layout */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {data.slice(0, 20).map((person) => {
          const size = Math.max(40, Math.min(80, (person.count / maxCount) * 80));
          const daysSince = Math.floor(
            (new Date(today).getTime() - new Date(person.lastContact).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          // Color: green (recent) → gray → red (old)
          const hue = daysSince <= 7 ? 142 : daysSince <= 30 ? 220 : daysSince <= 90 ? 40 : 0;
          const sat = daysSince <= 7 ? 70 : daysSince <= 30 ? 50 : 60;
          const lum = 45;

          return (
            <div
              key={person.name}
              className="flex flex-col items-center justify-center rounded-full shrink-0"
              style={{
                width: size,
                height: size,
                backgroundColor: `hsl(${hue}, ${sat}%, ${lum}%)`,
                opacity: 0.9,
              }}
              title={`${person.name}: ${person.count}건, 마지막 ${person.lastContact}`}
            >
              <span className="text-xs font-bold text-white leading-tight text-center px-1 truncate max-w-full">
                {person.name}
              </span>
              <span className="text-[9px] text-white/70">{person.count}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(142,70%,45%)" }} />
          최근 7일
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(220,50%,45%)" }} />
          30일 이내
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(40,60%,45%)" }} />
          90일 이내
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(0,60%,45%)" }} />
          90일+
        </span>
      </div>

      {/* Table for top contacts */}
      <div className="mt-4 space-y-1.5">
        {data.slice(0, 8).map((person) => {
          const daysSince = Math.floor(
            (new Date(today).getTime() - new Date(person.lastContact).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const barWidth = Math.round((person.count / maxCount) * 100);

          return (
            <div key={person.name} className="flex items-center gap-2 text-xs">
              <span className="w-16 truncate text-gray-300">{person.name}</span>
              <div className="flex-1 h-3 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-pink-500/60"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-gray-500 w-8 text-right">{person.count}건</span>
              <span className="text-gray-600 w-12 text-right">
                {daysSince === 0 ? "오늘" : `${daysSince}일 전`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
