"use client";

import { useState, useCallback } from "react";
import type { DailyCount } from "@/lib/notion";

interface Props {
  data: DailyCount[];
}

const CELL_SIZE = 12;
const GAP = 2;
const TOTAL = CELL_SIZE + GAP;

function getColor(count: number): string {
  if (count === 0) return "#161616";
  if (count === 1) return "#0e4429";
  if (count === 2) return "#006d32";
  if (count <= 4) return "#26a641";
  return "#39d353";
}

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

interface TooltipInfo {
  x: number;
  y: number;
  date: string;
  count: number;
}

export default function Heatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent<SVGRectElement>, day: DailyCount) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.closest(".heatmap-container")?.getBoundingClientRect();
    if (!parent) return;
    setTooltip({
      x: rect.left - parent.left + CELL_SIZE / 2,
      y: rect.top - parent.top - 8,
      date: day.date,
      count: day.count,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (!data.length) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  // Group by week (columns), rows = days of week (Mon=0 ... Sun=6)
  const weeks: (DailyCount | null)[][] = [];
  let currentWeek: (DailyCount | null)[] = [];

  // Fill leading empty cells for the first week
  const firstDay = new Date(data[0].date);
  const firstDow = (firstDay.getDay() + 6) % 7; // Monday = 0
  for (let i = 0; i < firstDow; i++) {
    currentWeek.push(null);
  }

  for (const d of data) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const svgWidth = weeks.length * TOTAL + 30;
  const svgHeight = 7 * TOTAL + 24;

  // Calculate month label positions
  const monthPositions: { label: string; x: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const firstNonNull = weeks[w].find((d) => d !== null);
    if (firstNonNull) {
      const month = new Date(firstNonNull.date).getMonth();
      if (month !== lastMonth) {
        monthPositions.push({ label: MONTH_LABELS[month], x: w * TOTAL + 30 });
        lastMonth = month;
      }
    }
  }

  const totalRecords = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest">
          연간 기록 히트맵
        </h2>
        <div className="flex gap-4 text-xs text-[#666]">
          <span>총 <span className="text-white font-medium">{totalRecords}</span>건</span>
          <span>활동일 <span className="text-white font-medium">{activeDays}</span>일</span>
        </div>
      </div>

      <div className="overflow-x-auto heatmap-container relative">
        {/* Custom tooltip */}
        {tooltip && (
          <div
            className="absolute z-10 pointer-events-none px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
              background: "#333",
              color: "#e5e5e5",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <span className="font-medium">{tooltip.date}</span>
            <span className="text-gray-400 ml-1.5">{tooltip.count}건</span>
          </div>
        )}

        <svg width={svgWidth} height={svgHeight} className="block">
          {/* Month labels */}
          {monthPositions.map(({ label, x }) => (
            <text
              key={`${label}-${x}`}
              x={x}
              y={10}
              fill="#555"
              fontSize={10}
              fontFamily="sans-serif"
            >
              {label}
            </text>
          ))}

          {/* Day labels */}
          {["월", "", "수", "", "금", "", ""].map((label, i) => (
            <text
              key={`day-${i}`}
              x={0}
              y={20 + i * TOTAL + CELL_SIZE - 2}
              fill="#444"
              fontSize={9}
              fontFamily="sans-serif"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, w) =>
            week.map((day, d) => {
              if (!day) return null;
              const isToday = day.date === todayStr;
              return (
                <g key={day.date}>
                  {isToday && (
                    <rect
                      x={w * TOTAL + 30 - 2}
                      y={d * TOTAL + 18 - 2}
                      width={CELL_SIZE + 4}
                      height={CELL_SIZE + 4}
                      rx={3}
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth={1.5}
                      opacity={0.8}
                    />
                  )}
                  <rect
                    x={w * TOTAL + 30}
                    y={d * TOTAL + 18}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    fill={getColor(day.count)}
                    stroke="#0d0d0d"
                    strokeWidth={0.5}
                    className="transition-colors duration-150"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => handleMouseEnter(e, day)}
                    onMouseLeave={handleMouseLeave}
                  />
                </g>
              );
            }),
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3 text-xs text-[#555]">
        <span>적음</span>
        {[0, 1, 2, 3, 5].map((n) => (
          <div
            key={n}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(n) }}
          />
        ))}
        <span>많음</span>
      </div>
    </div>
  );
}
