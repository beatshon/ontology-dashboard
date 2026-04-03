"use client";

const PERIODS = [
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
  { key: "3months", label: "최근 3개월" },
  { key: "all", label: "전체" },
] as const;

export type PeriodKey = (typeof PERIODS)[number]["key"];

export function getDateRange(period: PeriodKey): { start: string | null } {
  if (period === "all") return { start: null };

  const now = new Date();
  let start: Date;

  switch (period) {
    case "week": {
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "3months":
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
  }

  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString().split("T")[0] };
}

interface Props {
  current: PeriodKey;
  onChange?: (period: PeriodKey) => void;
  basePath?: string;
}

export default function PeriodFilter({ current, onChange, basePath = "/" }: Props) {
  const handleClick = (key: PeriodKey) => {
    if (onChange) {
      onChange(key);
      // Update URL without reload
      const url = key === "all" ? basePath : `${basePath}?period=${key}`;
      window.history.replaceState(null, "", url);
    }
  };

  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      {PERIODS.map(({ key, label }) => {
        if (onChange) {
          return (
            <button
              key={key}
              onClick={() => handleClick(key)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 btn-press ${
                current === key
                  ? "bg-[#333] text-white font-medium"
                  : "bg-[#1a1a1a] text-[#666] hover:text-[#999] hover:bg-[#222]"
              }`}
            >
              {label}
            </button>
          );
        }

        const href = key === "all" ? basePath : `${basePath}?period=${key}`;
        return (
          <a
            key={key}
            href={href}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              current === key
                ? "bg-[#333] text-white"
                : "bg-[#1a1a1a] text-[#666] hover:text-[#999] hover:bg-[#222]"
            }`}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}
