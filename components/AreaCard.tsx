import Link from "next/link";
import { useMemo } from "react";
import type { AreaData } from "@/types";

// Warm color mapping for each area color
const WARM_COLORS: Record<string, string> = {
  "#4ade80": "#86efac", // green -> warm green
  "#60a5fa": "#93c5fd", // blue -> warm blue
  "#f472b6": "#f9a8d4", // pink -> warm pink
  "#a78bfa": "#c4b5fd", // purple -> warm purple
  "#fb923c": "#fdba74", // orange -> warm orange
  "#f9a8d4": "#fda4af", // rose -> warm rose
  "#fbbf24": "#fde047", // yellow -> warm yellow
};

function MiniSparkline({ records, color }: { records: AreaData["records"]; color: string }) {
  const dailyCounts = useMemo(() => {
    const counts: number[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = records.filter(
        (r) => (r.date || r.createdAt).slice(0, 10) === dateStr,
      ).length;
      counts.push(count);
    }
    return counts;
  }, [records]);

  const max = Math.max(...dailyCounts, 1);
  const width = 72;
  const height = 24;
  const padding = 2;

  const points = dailyCounts
    .map((count, i) => {
      const x = padding + (i / 6) * (width - padding * 2);
      const y = height - padding - (count / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const hasActivity = dailyCounts.some((c) => c > 0);

  if (!hasActivity) return null;

  // Build area fill path
  const areaPoints = dailyCounts.map((count, i) => {
    const x = padding + (i / 6) * (width - padding * 2);
    const y = height - padding - (count / max) * (height - padding * 2);
    return { x, y };
  });

  const areaPath = `M ${areaPoints[0].x},${areaPoints[0].y} ${areaPoints.map(p => `L ${p.x},${p.y}`).join(" ")} L ${areaPoints[areaPoints.length - 1].x},${height} L ${areaPoints[0].x},${height} Z`;

  return (
    <svg width={width} height={height} className="sparkline-enter" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#sparkGrad-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      {/* Highlight last point */}
      {dailyCounts[6] > 0 && (() => {
        const lastX = padding + (6 / 6) * (width - padding * 2);
        const lastY = height - padding - (dailyCounts[6] / max) * (height - padding * 2);
        return <circle cx={lastX} cy={lastY} r={2.5} fill={color} opacity={0.9} />;
      })()}
    </svg>
  );
}

export default function AreaCard({ data }: { data: AreaData }) {
  const { area, records, total } = data;
  const warmColor = WARM_COLORS[area.color] || area.color;

  return (
    <Link
      href={`/area/${encodeURIComponent(area.key)}`}
      className="group relative block spring-hover"
      style={{
        borderRadius: "var(--card-radius)",
      }}
    >
      <div
        className="relative overflow-hidden h-full"
        style={{
          background: `linear-gradient(135deg, #1a1a1a 0%, #1c1c1c 100%)`,
          borderRadius: "var(--card-radius)",
          padding: "20px",
          boxShadow: "var(--card-shadow)",
          borderLeft: `3px solid ${warmColor}`,
        }}
      >
        {/* Subtle warm glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            borderRadius: "var(--card-radius)",
            background: `radial-gradient(circle at top left, ${area.color}12 0%, transparent 60%)`,
          }}
        />

        {/* Top: emoji + name */}
        <div className="flex items-center gap-3 mb-3 relative">
          <span className="text-3xl">{area.emoji}</span>
          <span className="font-semibold text-sm text-[#ccc]">{area.key}</span>
        </div>

        {/* Big count number (Toss-style) */}
        <div className="flex items-baseline gap-1 mb-2 relative">
          <span
            className="text-2xl font-black"
            style={{ color: warmColor }}
          >
            {total}
          </span>
          <span className="text-xs text-gray-500">건</span>
        </div>

        {/* 7-day sparkline */}
        <div className="relative">
          <MiniSparkline records={records} color={area.color} />
        </div>
      </div>
    </Link>
  );
}
