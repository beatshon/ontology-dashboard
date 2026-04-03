"use client";

import { useEffect, useState } from "react";
import { AREAS } from "@/lib/areas";

interface AreaTransition {
  from: string;
  to: string;
  count: number;
  sentiment_flow: "positive" | "negative" | "neutral";
}

interface CrossAnalysisData {
  patterns: AreaTransition[];
  daily_flows: { date: string; sequence: string[] }[];
}

function getAreaColor(key: string): string {
  return AREAS.find((a) => a.key === key)?.color ?? "#888";
}

function getAreaEmoji(key: string): string {
  return AREAS.find((a) => a.key === key)?.emoji ?? "";
}

function getSentimentColor(sentiment: "positive" | "negative" | "neutral"): string {
  if (sentiment === "positive") return "#4ade80";
  if (sentiment === "negative") return "#f87171";
  return "#6b7280";
}

function getPatternInsight(pattern: AreaTransition): string {
  const fromEmoji = getAreaEmoji(pattern.from);
  const toEmoji = getAreaEmoji(pattern.to);
  if (pattern.sentiment_flow === "positive") {
    return `${fromEmoji} ${pattern.from} 기록 후 ${toEmoji} ${pattern.to} 영역 활동이 자주 이어지는 긍정적 패턴`;
  }
  if (pattern.sentiment_flow === "negative") {
    return `${fromEmoji} ${pattern.from}에서 ${toEmoji} ${pattern.to}로 이어지는 흐름이 ${pattern.count}회 관찰됨`;
  }
  return `${fromEmoji} ${pattern.from} → ${toEmoji} ${pattern.to} 전환이 ${pattern.count}회 발생`;
}

/** SVG Sankey-style flow diagram (no library) */
function SankeyDiagram({ patterns }: { patterns: AreaTransition[] }) {
  if (patterns.length === 0) return null;

  const top = patterns.slice(0, 8);
  const maxCount = Math.max(...top.map((p) => p.count), 1);

  // Collect unique from/to areas
  const fromAreas = [...new Set(top.map((p) => p.from))];
  const toAreas = [...new Set(top.map((p) => p.to))];

  const svgWidth = 360;
  const svgHeight = Math.max(fromAreas.length, toAreas.length) * 48 + 40;
  const leftX = 80;
  const rightX = svgWidth - 80;
  const nodeHeight = 28;

  // Position from/to nodes
  const fromPositions: Record<string, number> = {};
  fromAreas.forEach((a, i) => {
    fromPositions[a] = 30 + i * 48;
  });

  const toPositions: Record<string, number> = {};
  toAreas.forEach((a, i) => {
    toPositions[a] = 30 + i * 48;
  });

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full max-w-[360px] mx-auto"
      >
        {/* Flow paths */}
        {top.map((p, i) => {
          const y1 = fromPositions[p.from] + nodeHeight / 2;
          const y2 = toPositions[p.to] + nodeHeight / 2;
          const thickness = Math.max(2, (p.count / maxCount) * 12);
          const color = getSentimentColor(p.sentiment_flow);
          const midX = (leftX + rightX) / 2;

          return (
            <g key={`flow-${i}`}>
              <path
                d={`M ${leftX + 40} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${rightX - 40} ${y2}`}
                fill="none"
                stroke={color}
                strokeWidth={thickness}
                opacity={0.35}
                strokeLinecap="round"
              />
              {/* Count label on path */}
              <text
                x={midX}
                y={(y1 + y2) / 2 - 4}
                textAnchor="middle"
                className="text-[9px] fill-gray-500"
              >
                {p.count}
              </text>
            </g>
          );
        })}

        {/* From nodes (left) */}
        {fromAreas.map((area) => {
          const y = fromPositions[area];
          const color = getAreaColor(area);
          return (
            <g key={`from-${area}`}>
              <rect
                x={leftX - 36}
                y={y}
                width={76}
                height={nodeHeight}
                rx={8}
                fill={color + "18"}
                stroke={color + "44"}
                strokeWidth={1}
              />
              <text
                x={leftX + 2}
                y={y + nodeHeight / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] font-medium"
                fill={color}
              >
                {getAreaEmoji(area)} {area}
              </text>
            </g>
          );
        })}

        {/* To nodes (right) */}
        {toAreas.map((area) => {
          const y = toPositions[area];
          const color = getAreaColor(area);
          return (
            <g key={`to-${area}`}>
              <rect
                x={rightX - 40}
                y={y}
                width={76}
                height={nodeHeight}
                rx={8}
                fill={color + "18"}
                stroke={color + "44"}
                strokeWidth={1}
              />
              <text
                x={rightX - 2}
                y={y + nodeHeight / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] font-medium"
                fill={color}
              >
                {getAreaEmoji(area)} {area}
              </text>
            </g>
          );
        })}

        {/* Arrow label */}
        <text
          x={svgWidth / 2}
          y={svgHeight - 8}
          textAnchor="middle"
          className="text-[9px] fill-gray-600"
        >
          Trigger → Response
        </text>
      </svg>
    </div>
  );
}

export default function CrossAreaAnalysis() {
  const [data, setData] = useState<CrossAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cross-analysis")
      .then((r) => r.json())
      .then((d: CrossAnalysisData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData({ patterns: [], daily_flows: [] });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="toss-card mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-bold mb-4">크로스 영역 인과 분석</h2>
        <div className="h-32 skeleton-shimmer rounded-xl" />
      </div>
    );
  }

  if (!data || data.patterns.length === 0) {
    return (
      <div className="toss-card mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔗</span>
          <h2 className="text-xs font-semibold text-[#888] uppercase tracking-widest">
            크로스 영역 인과 분석
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          아직 영역 간 전환 패턴이 충분하지 않아요. 다양한 영역에서 기록을 쌓아보세요.
        </p>
      </div>
    );
  }

  const topPatterns = data.patterns.slice(0, 3);

  return (
    <div className="toss-card mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔗</span>
        <h2 className="text-xs font-semibold text-[#888] uppercase tracking-widest">
          크로스 영역 인과 분석
        </h2>
      </div>

      {/* Sankey diagram */}
      <div className="mb-5">
        <SankeyDiagram patterns={data.patterns} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded-full bg-green-400" /> 긍정
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded-full bg-red-400" /> 부정
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 rounded-full bg-gray-500" /> 중립
        </span>
      </div>

      {/* Top 3 pattern insights */}
      <div className="space-y-2.5 pt-3 border-t border-white/5">
        <p className="text-[10px] text-gray-500 mb-2">주요 패턴</p>
        {topPatterns.map((pattern, i) => (
          <div
            key={`${pattern.from}-${pattern.to}-${i}`}
            className="flex items-start gap-2.5 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/5"
          >
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
              style={{
                backgroundColor: getSentimentColor(pattern.sentiment_flow) + "22",
                color: getSentimentColor(pattern.sentiment_flow),
              }}
            >
              {i + 1}
            </span>
            <div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {getPatternInsight(pattern)}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {pattern.count}회 발생
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent daily flows */}
      {data.daily_flows.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-[10px] text-gray-500 mb-2">최근 영역 흐름</p>
          <div className="space-y-1.5">
            {data.daily_flows.slice(0, 5).map((flow) => (
              <div
                key={flow.date}
                className="flex items-center gap-2 text-xs"
              >
                <span className="text-gray-600 w-12 flex-shrink-0 text-[10px]">
                  {flow.date.slice(5)}
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {flow.sequence.map((area, j) => (
                    <span key={`${flow.date}-${j}`} className="flex items-center gap-0.5">
                      {j > 0 && (
                        <span className="text-gray-600 text-[10px] mx-0.5">→</span>
                      )}
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: getAreaColor(area) + "18",
                          color: getAreaColor(area),
                        }}
                      >
                        {getAreaEmoji(area)} {area}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
