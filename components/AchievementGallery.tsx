import type { Achievement } from "@/types";

const SIZE_CONFIG = {
  "소 (일상적 완료)": { label: "소", color: "#666", bg: "#66666622" },
  "중 (의미 있는 성취)": { label: "중", color: "#60a5fa", bg: "#60a5fa22" },
  "대 (인생 이정표)": { label: "대", color: "#fbbf24", bg: "#fbbf2422" },
};

const AREA_COLORS: Record<string, string> = {
  나: "#4ade80", 일: "#60a5fa", 관계: "#f472b6",
  배움: "#a78bfa", 건강: "#fb923c", 가족: "#f9a8d4",
  "경제적 자유": "#fbbf24", 기타: "#666",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function AchievementGallery({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 text-center">
        <p className="text-[#444]">아직 이룸 기록이 없어요</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest">
          ✨ 이룸 — 달성한 것들
        </h2>
        <span className="text-xs text-[#555]">{achievements.length}개</span>
      </div>

      <div className="flex flex-col gap-3">
        {achievements.map((a) => {
          const sizeConf = a.size ? SIZE_CONFIG[a.size] : null;
          const areaColor = a.area ? AREA_COLORS[a.area] ?? "#666" : "#666";

          return (
            <div
              key={a.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#111] border border-[#222] hover:border-[#333] transition-colors"
            >
              <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-0.5">
                {sizeConf && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: sizeConf.bg, color: sizeConf.color }}
                  >
                    {sizeConf.label}
                  </span>
                )}
                {a.area && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: areaColor }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#e5e5e5] font-medium leading-snug">{a.title}</p>
                {a.content && (
                  <p className="text-xs text-[#555] mt-1 line-clamp-2">{a.content}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {a.area && (
                    <span className="text-[11px]" style={{ color: areaColor }}>
                      {a.area}
                    </span>
                  )}
                  {a.points && (
                    <span className="text-[11px] text-[#444]">+{a.points}pt</span>
                  )}
                  <span className="text-[11px] text-[#333] ml-auto">
                    {formatDate(a.date || a.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
