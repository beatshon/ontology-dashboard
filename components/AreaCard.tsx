import type { AreaData } from "@/types";

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function AreaCard({ data }: { data: AreaData }) {
  const { area, records, total } = data;

  return (
    <div
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#3a3a3a] transition-colors"
      style={{ borderTopColor: area.color, borderTopWidth: 2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{area.emoji}</span>
          <span className="font-semibold text-[#e5e5e5]">{area.key}</span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: area.color + "22", color: area.color }}
        >
          {total}개
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {records.length === 0 ? (
          <p className="text-[#444] text-sm py-2 text-center">아직 기록 없음</p>
        ) : (
          records.slice(0, 4).map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-2 py-1.5 border-b border-[#222] last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#ddd] truncate leading-snug">{r.title}</p>
                {r.content && (
                  <p className="text-xs text-[#555] truncate mt-0.5">{r.content}</p>
                )}
              </div>
              {(r.date || r.createdAt) && (
                <span className="text-[11px] text-[#444] flex-shrink-0 mt-0.5">
                  {formatDate(r.date || r.createdAt)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
