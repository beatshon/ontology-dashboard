"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";

// Siri 서버 API (로컬 Mac에서 실행 중)
const API_BASE = "http://localhost:18080";

interface Milestone {
  value: number;
  label: string;
  achieved: boolean;
}

interface CheckIn {
  date: string;
  value: number;
  note: string;
}

interface Goal {
  id: string;
  title: string;
  area: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  created: string;
  milestones: Milestone[];
  check_ins: CheckIn[];
  status: string;
}

const AREA_OPTIONS = ["나", "일", "관계", "배움", "건강", "가족", "경제적 자유"];
const AREA_EMOJI: Record<string, string> = {
  "나": "🌱", "일": "💼", "관계": "🤝", "배움": "📚",
  "건강": "🏃", "가족": "🏡", "경제적 자유": "💰",
};

function progressPct(current: number, target: number): number {
  return target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
}

function daysRemaining(deadline: string): number {
  return Math.max(Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000), 0);
}

function progressColor(pct: number): string {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-blue-500";
  if (pct >= 25) return "bg-amber-500";
  return "bg-red-500";
}

export default function GoalsClient() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [updateGoalId, setUpdateGoalId] = useState<string | null>(null);
  const [updateValue, setUpdateValue] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [error, setError] = useState("");

  // 새 목표 폼
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("개");
  const [newDeadline, setNewDeadline] = useState("");
  const [newArea, setNewArea] = useState("나");
  const [newCurrent, setNewCurrent] = useState("0");

  const fetchGoals = () => {
    fetch(`${API_BASE}/api/goals`)
      .then((r) => r.json())
      .then((d) => setGoals(d.goals || []))
      .catch(() => setError("목표 데이터를 불러올 수 없어요. Mac이 켜져있는지 확인하세요."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleAdd = async () => {
    if (!newTitle || !newTarget) return;
    try {
      await fetch(`${API_BASE}/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          target: parseFloat(newTarget),
          unit: newUnit,
          deadline: newDeadline,
          area: newArea,
          current: parseFloat(newCurrent) || 0,
        }),
      });
      setShowForm(false);
      setNewTitle(""); setNewTarget(""); setNewUnit("개"); setNewDeadline(""); setNewArea("나"); setNewCurrent("0");
      fetchGoals();
    } catch {
      setError("목표 추가 실패");
    }
  };

  const handleUpdate = async () => {
    if (!updateGoalId || !updateValue) return;
    try {
      await fetch(`${API_BASE}/api/goals/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updateGoalId, value: parseFloat(updateValue), note: updateNote }),
      });
      setUpdateGoalId(null); setUpdateValue(""); setUpdateNote("");
      fetchGoals();
    } catch {
      setError("진행률 업데이트 실패");
    }
  };

  const now = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  const active = goals.filter((g) => g.status === "active");
  const achieved = goals.filter((g) => g.status === "achieved");

  return (
    <main className="max-w-7xl mx-auto px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">🎯 목표 관리</h1>
          <p className="text-[#555] mt-1 text-xs sm:text-sm">목표 설정 · 추적 · 달성</p>
        </div>
        <span className="text-[10px] sm:text-xs text-[#444]">{now}</span>
      </div>

      <Navigation />

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-300">✕</button>
        </div>
      )}

      {/* 새 목표 추가 버튼 */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl transition"
      >
        {showForm ? "취소" : "+ 새 목표 추가"}
      </button>

      {/* 새 목표 폼 */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-[#1a1a1a] p-5 border border-[#333]">
          <h3 className="text-sm font-bold text-white mb-4">새 목표</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="목표 제목 (예: YouTube 구독자)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#555]"
            />
            <div className="flex gap-2">
              <input
                placeholder="목표값 (예: 1000)"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                type="number"
                className="flex-1 bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#555]"
              />
              <input
                placeholder="단위"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-16 bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#555]"
              />
            </div>
            <input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#555]"
            />
            <div className="flex gap-2">
              <select
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                className="flex-1 bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#555]"
              >
                {AREA_OPTIONS.map((a) => (
                  <option key={a} value={a}>{AREA_EMOJI[a]} {a}</option>
                ))}
              </select>
              <input
                placeholder="현재값"
                value={newCurrent}
                onChange={(e) => setNewCurrent(e.target.value)}
                type="number"
                className="w-20 bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#555]"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition"
          >
            목표 추가
          </button>
        </div>
      )}

      {/* 활성 목표 */}
      {loading ? (
        <div className="text-gray-500 text-sm">로딩 중...</div>
      ) : (
        <div className="space-y-4">
          {active.map((goal) => {
            const pct = progressPct(goal.current, goal.target);
            const days = daysRemaining(goal.deadline);

            return (
              <div key={goal.id} className="rounded-2xl bg-[#1a1a1a] p-5 border border-[#2a2a2a]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-500">{AREA_EMOJI[goal.area]} {goal.area}</span>
                    <h3 className="text-base font-bold text-white">{goal.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{pct}%</div>
                    <div className="text-[10px] text-gray-500">D-{days}</div>
                  </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="h-3 bg-[#262626] rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${progressColor(pct)} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{goal.current} {goal.unit}</span>
                  <span>{goal.target} {goal.unit}</span>
                </div>

                {/* 마일스톤 */}
                <div className="flex gap-2 mb-3">
                  {goal.milestones.map((ms, i) => (
                    <div
                      key={i}
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        ms.achieved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#222] text-gray-600"
                      }`}
                    >
                      {ms.achieved ? "✅" : "⬜"} {ms.label}
                    </div>
                  ))}
                </div>

                {/* 업데이트 버튼 */}
                {updateGoalId === goal.id ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      placeholder="현재값"
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      type="number"
                      className="w-24 bg-[#222] border border-[#333] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none"
                    />
                    <input
                      placeholder="메모 (선택)"
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      className="flex-1 bg-[#222] border border-[#333] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none"
                    />
                    <button onClick={handleUpdate} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">저장</button>
                    <button onClick={() => setUpdateGoalId(null)} className="px-3 py-1.5 bg-[#333] text-gray-400 text-xs rounded-lg">취소</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setUpdateGoalId(goal.id); setUpdateValue(String(goal.current)); }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    📊 진행률 업데이트
                  </button>
                )}

                {/* 최근 체크인 */}
                {goal.check_ins.length > 1 && (
                  <div className="mt-3 border-t border-[#222] pt-2">
                    <div className="text-[10px] text-gray-600 mb-1">최근 기록</div>
                    {goal.check_ins.slice(-3).reverse().map((ci, i) => (
                      <div key={i} className="text-[10px] text-gray-500">
                        {ci.date} — {ci.value}{goal.unit} {ci.note && `(${ci.note})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {active.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-10">
              <p className="text-lg mb-2">🎯</p>
              <p className="text-sm">아직 목표가 없어요.</p>
              <p className="text-xs text-gray-600 mt-1">위의 &quot;+ 새 목표 추가&quot; 버튼으로 시작하세요!</p>
            </div>
          )}

          {/* 달성 목표 */}
          {achieved.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-[#888] uppercase tracking-widest mb-3">🏆 달성한 목표</h3>
              {achieved.map((goal) => (
                <div key={goal.id} className="rounded-xl bg-[#1a1a1a] p-4 mb-2 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-400">✅ {goal.title}</span>
                    <span className="text-xs text-gray-500">{goal.target}{goal.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
