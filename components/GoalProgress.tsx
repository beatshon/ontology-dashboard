import type { AreaData } from "@/types";

// 영역별 월간 목표 기록 수 (기본값, 추후 설정 가능하게 확장)
const MONTHLY_GOALS: Record<string, number> = {
  나: 4,
  일: 8,
  관계: 4,
  배움: 6,
  건강: 8,
  가족: 4,
  "경제적 자유": 4,
};

interface Props {
  areasData: AreaData[];
  monthlyRecordCounts: Record<string, number>;
}

export default function GoalProgress({ areasData, monthlyRecordCounts }: Props) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest">
          이번 달 목표
        </h2>
        <span className="text-xs text-[#555]">
          {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {areasData.map(({ area }) => {
          const goal = MONTHLY_GOALS[area.key] ?? 4;
          const current = monthlyRecordCounts[area.key] ?? 0;
          const pct = Math.min(100, Math.round((current / goal) * 100));
          const done = current >= goal;

          return (
            <div key={area.key} className="flex items-center gap-3">
              <span className="text-base w-6 text-center flex-shrink-0">{area.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#ccc]">{area.key}</span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: done ? "#4ade80" : area.color }}
                  >
                    {current}/{goal}
                  </span>
                </div>
                <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: done ? "#4ade80" : area.color,
                      opacity: done ? 1 : 0.7,
                    }}
                  />
                </div>
              </div>
              {done && (
                <span className="text-[10px] text-[#4ade80] flex-shrink-0">달성!</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
