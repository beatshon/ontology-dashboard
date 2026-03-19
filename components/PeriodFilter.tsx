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
  basePath?: string;
}

export default function PeriodFilter({ current, basePath = "/" }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {PERIODS.map(({ key, label }) => {
        const href =
          key === "all" ? basePath : `${basePath}?period=${key}`;
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
