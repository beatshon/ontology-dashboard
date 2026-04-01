"use client";

import { useEffect, useState, useCallback } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { AREAS } from "@/lib/areas";
import { getDateRange } from "@/components/PeriodFilter";
import type { PeriodKey } from "@/components/PeriodFilter";
import type {
  AreaData,
  SentimentRecord,
  RelationNode,
  AchievementTrend,
} from "@/types";

import StatsChart from "@/components/StatsChart";
import BalanceRadar from "@/components/BalanceRadar";
import TrendChart from "@/components/TrendChart";
import GoalProgress from "@/components/GoalProgress";
import AreaCard from "@/components/AreaCard";
import AchievementGallery from "@/components/AchievementGallery";
import Heatmap from "@/components/Heatmap";
import MonthlyComparisonChart from "@/components/MonthlyComparison";
import PeriodFilter from "@/components/PeriodFilter";
import SentimentChart from "@/components/SentimentChart";
import RelationNetwork from "@/components/RelationNetwork";
import AchievementTrendChart from "@/components/AchievementTrend";
import DayOneArchive from "@/components/DayOneArchive";
import RecentTimeline from "@/components/RecentTimeline";
import YouTubeSection from "@/components/YouTubeSection";
import SearchBar from "@/components/SearchBar";
import TitleBadge from "@/components/TitleBadge";
import Navigation from "@/components/Navigation";
import TodayHighlight from "@/components/TodayHighlight";
import WeeklyInsight from "@/components/WeeklyInsight";
import MoodCheckin from "@/components/MoodCheckin";
import WeeklyReport from "@/components/WeeklyReport";
import MilestoneTracker from "@/components/MilestoneTracker";
import EntityGraph from "@/components/EntityGraph";
import CrossAreaAnalysis from "@/components/CrossAreaAnalysis";
import LifeNarrative from "@/components/LifeNarrative";
import OnThisDay from "@/components/OnThisDay";

type TabKey = "today" | "records" | "analysis" | "growth";

const TABS: { key: TabKey; label: string; hash: string }[] = [
  { key: "today", label: "오늘", hash: "#today" },
  { key: "records", label: "기록", hash: "#records" },
  { key: "analysis", label: "분석", hash: "#analysis" },
  { key: "growth", label: "성장", hash: "#growth" },
];

function calculateStreak(areasData: AreaData[]): number {
  const dateSets = new Set<string>();
  for (const d of areasData) {
    for (const r of d.records) {
      const date = (r.date || r.createdAt).slice(0, 10);
      dateSets.add(date);
    }
  }

  let streak = 0;
  const current = new Date();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const dateStr = current.toISOString().slice(0, 10);
    if (dateSets.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getMoodEmoji(): string | null {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem(`mood_${today}`);
    if (!stored) return null;
    const data = JSON.parse(stored);
    const moodMap: Record<string, string> = {
      good: "😊",
      okay: "🙂",
      neutral: "😐",
      sad: "😔",
      hard: "😢",
    };
    return moodMap[data.mood] || null;
  } catch {
    return null;
  }
}

function HeroSection({
  weekCount,
  streak,
  todayCount,
}: {
  weekCount: number;
  streak: number;
  todayCount: number;
}) {
  const animatedWeek = useCountUp(weekCount);
  const animatedToday = useCountUp(todayCount);
  const moodEmoji = getMoodEmoji();

  const fireCount = streak < 3 ? 1 : streak < 7 ? 2 : 3;
  const fires = streak > 0 ? Array.from({ length: fireCount }, () => "\uD83D\uDD25").join("") : "";

  return (
    <div
      className="toss-card relative overflow-hidden mb-5"
      style={{
        background: "linear-gradient(135deg, rgba(254,243,199,0.08) 0%, rgba(253,230,138,0.05) 50%, rgba(13,13,13,1) 100%)",
      }}
    >
      {/* Warm gradient overlay */}
      <div
        className="absolute top-0 left-0 w-40 h-40 opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #fde68a40 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        {/* Big number - Toss style */}
        <p className="text-gray-400 text-sm mb-1">이번 주 기록</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl sm:text-5xl font-black text-white counter-transition">
            {animatedWeek}
          </span>
          <span className="text-lg text-gray-400 font-medium">건</span>
        </div>

        {/* Subtitle: streak + mood in one line */}
        <div className="flex items-center gap-3 text-sm">
          {streak > 0 && (
            <span className="text-amber-400/80 font-medium">
              {fires} {streak}일 연속
            </span>
          )}
          {streak > 0 && todayCount > 0 && (
            <span className="text-gray-600">|</span>
          )}
          {todayCount > 0 && (
            <span className="text-gray-400">
              오늘 <span className="text-white font-semibold">{animatedToday}</span>건
            </span>
          )}
          {moodEmoji && (
            <>
              <span className="text-gray-600">|</span>
              <span className="text-lg">{moodEmoji}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingCard({ title }: { title: string }) {
  return (
    <div className="toss-card">
      <h2 className="text-base sm:text-lg font-bold mb-4">{title}</h2>
      <div className="h-24 sm:h-32 skeleton-shimmer rounded-xl" />
    </div>
  );
}

function QuickRecordFAB() {
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState<string>("나");
  const [text, setText] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pending_records");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPendingCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    if (!text.trim()) return;

    const record = {
      area,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem("pending_records");
      const existing = stored ? JSON.parse(stored) : [];
      const updated = [...existing, record];
      localStorage.setItem("pending_records", JSON.stringify(updated));
      setPendingCount(updated.length);
    } catch {
      // storage full
    }

    setText("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-2xl shadow-lg hover:shadow-xl flex items-center justify-center fab-pulse"
        style={{
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
        }}
        aria-label="빠른 기록"
      >
        +
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Bottom sheet modal (Toss-style) */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fab-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md fab-modal-enter"
            style={{
              background: "#1a1a1a",
              borderRadius: "20px 20px 0 0",
              padding: "24px",
              boxShadow: "0 -4px 30px rgba(0,0,0,0.4)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center mb-4 sm:hidden">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">빠른 기록</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-300 transition text-lg"
              >
                x
              </button>
            </div>

            {/* Area selector */}
            <div className="flex gap-1.5 flex-wrap mb-4">
              {AREAS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setArea(a.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all duration-300 border ${
                    area === a.key
                      ? "border-white/20 text-white"
                      : "border-[#333] text-gray-500 hover:border-[#444]"
                  }`}
                  style={{
                    ...(area === a.key
                      ? { backgroundColor: a.color + "22", borderColor: a.color + "44" }
                      : {}),
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {a.emoji} {a.key}
                </button>
              ))}
            </div>

            {/* Text input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="기록할 내용을 입력하세요..."
              rows={3}
              className="w-full bg-[#222] border border-[#333] rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/30 transition resize-none"
              autoFocus
            />

            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-gray-600">
                {pendingCount > 0 ? `대기 중 ${pendingCount}건` : ""}
              </span>
              <button
                onClick={handleSave}
                disabled={!text.trim()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90 disabled:opacity-40 btn-press"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardClient() {
  // Tab state with URL hash routing
  const [activeTab, setActiveTab] = useState<TabKey>("today");

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    const tabDef = TABS.find((t) => t.key === tab);
    if (tabDef) {
      window.history.replaceState(null, "", tabDef.hash);
    }
  }, []);

  // Read initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    const matchedTab = TABS.find((t) => t.hash === hash);
    if (matchedTab) setActiveTab(matchedTab.key);

    const onHashChange = () => {
      const h = window.location.hash;
      const m = TABS.find((t) => t.hash === h);
      if (m) setActiveTab(m.key);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // URL에서 period 파라미터 추출 (클라이언트 사이드)
  const [period, setPeriod] = useState<PeriodKey>("all");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("period") as PeriodKey;
    if (p) setPeriod(p);
  }, []);
  const { start } = getDateRange(period);

  const [areasData, setAreasData] = useState<AreaData[] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentRecord[] | null>(null);
  const [relationData, setRelationData] = useState<RelationNode[] | null>(null);
  const [achievementTrend, setAchievementTrend] = useState<AchievementTrend[] | null>(null);

  // 캐시 우선 fetch (2초 타임아웃) → 실패 시 직접 API
  const fetchWithTimeout = (url: string, ms = 2000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).then((r) => { clearTimeout(timer); return r.ok ? r.json() : Promise.reject(); }).catch(() => { clearTimeout(timer); return Promise.reject(); });
  };
  const fetchCacheFirst = (cacheUrl: string, fallbackUrl: string) =>
    fetchWithTimeout(cacheUrl, 2000).catch(() => fetch(fallbackUrl).then((r) => r.json()));

  const CACHE = "https://api.againline.kr";
  const fetchAll = () => {
    const qs = start ? `?start=${start}` : "";
    fetch(`/api/areas${qs}`).then((r) => r.json()).then(setAreasData).catch(() => setAreasData([]));
    fetch(`/api/stats${qs}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ achievements: [], trend: [], monthlyCounts: [], heatmapData: [], monthlyComparison: [] }));
    fetchCacheFirst(`${CACHE}/api/cache/sentiment`, "/api/sentiment").then(setSentimentData).catch(() => setSentimentData([]));
    fetchCacheFirst(`${CACHE}/api/cache/relation`, "/api/relation").then(setRelationData).catch(() => setRelationData([]));
    fetchCacheFirst(`${CACHE}/api/cache/achievement-trend`, "/api/achievement-trend").then(setAchievementTrend).catch(() => setAchievementTrend([]));
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000); // 5분
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  const now = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "좋은 아침이에요" : hour < 18 ? "좋은 오후예요" : "좋은 저녁이에요";

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const todayCount = areasData
    ? areasData.reduce(
        (sum, d) =>
          sum +
          d.records.filter(
            (r) => (r.date || r.createdAt).slice(0, 10) === todayStr
          ).length,
        0
      )
    : 0;

  const weekCount = areasData
    ? areasData.reduce(
        (sum, d) =>
          sum +
          d.records.filter(
            (r) => (r.date || r.createdAt).slice(0, 10) >= weekAgo
          ).length,
        0
      )
    : 0;

  const streak = areasData ? calculateStreak(areasData) : 0;

  const chartStats = areasData?.map((d) => ({
    area: d.area.key,
    emoji: d.area.emoji,
    count: d.total,
    color: d.area.color,
  })) || [];

  return (
    <main className="max-w-7xl mx-auto px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      {/* Minimal header: greeting + date */}
      <div className="mb-4 sm:mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {greeting}, 제이스님
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">{now}</p>
        </div>
      </div>

      <TitleBadge />
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      <PeriodFilter current={period} />

      {/* Tab content with slide transition */}
      <div key={activeTab}>
        {/* Tab 1: 오늘 (Today) */}
        {activeTab === "today" && (
          <div className="tab-panel">
            {/* Toss-style Hero Card */}
            {areasData && (
              <HeroSection
                weekCount={weekCount}
                streak={streak}
                todayCount={todayCount}
              />
            )}

            {/* Daily Mood Check-in */}
            <div className="mb-4 sm:mb-6">
              <MoodCheckin />
            </div>

            {/* Today Highlight + Weekly Insight side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div id="today-highlight">
                <TodayHighlight />
              </div>
              {areasData && <WeeklyInsight areasData={areasData} />}
            </div>

            {/* 7 Area Cards in compact grid */}
            <div id="areas-section">
              <h2 className="text-xs sm:text-sm font-semibold text-[#888] uppercase tracking-widest mb-3 sm:mb-4">
                7가지 영역
              </h2>
              {areasData ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {areasData.map((data) => (
                    <AreaCard key={data.area.key} data={data} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {AREAS.map((a) => <LoadingCard key={a.key} title={`${a.emoji} ${a.label}`} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: 기록 (Records) */}
        {activeTab === "records" && (
          <div className="tab-panel">
            <SearchBar />
            <div className="mt-4 sm:mt-6">
              <RecentTimeline />
            </div>
            <div className="mt-4 sm:mt-6">
              <OnThisDay />
            </div>
            <div className="mt-4 sm:mt-6">
              <DayOneArchive />
            </div>
          </div>
        )}

        {/* Tab 3: 분석 (Analysis) */}
        {activeTab === "analysis" && (
          <div className="tab-panel">
            {/* Weekly Report Card */}
            {areasData && (
              <WeeklyReport areasData={areasData} sentimentData={sentimentData} />
            )}

            {/* Entity Graph */}
            <div className="mb-4 sm:mb-6">
              <EntityGraph />
            </div>

            {/* Stats + Radar */}
            {areasData ? (
              <div id="stats-section" className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="lg:col-span-2">
                  <StatsChart stats={chartStats} />
                </div>
                <BalanceRadar stats={chartStats} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <LoadingCard title="영역별 기록" />
                <LoadingCard title="삶의 균형" />
              </div>
            )}

            {/* Trend + Goal */}
            {stats && areasData ? (
              <div id="trend-section" className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="lg:col-span-2">
                  <TrendChart data={stats.trend} />
                </div>
                <GoalProgress areasData={areasData} monthlyRecordCounts={stats.monthlyCounts} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="lg:col-span-2"><LoadingCard title="주간 기록 트렌드" /></div>
                <LoadingCard title="이번 달 목표" />
              </div>
            )}

            {/* Sentiment + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {sentimentData ? <SentimentChart data={sentimentData} /> : <LoadingCard title="감정 흐름" />}
              <div className="overflow-x-auto">
                {stats ? <Heatmap data={stats.heatmapData} /> : <LoadingCard title="연간 기록 히트맵" />}
              </div>
            </div>

            {/* Cross-Area Causal Analysis */}
            <CrossAreaAnalysis />
          </div>
        )}

        {/* Tab 4: 성장 (Growth) */}
        {activeTab === "growth" && (
          <div className="tab-panel">
            {/* Life Narrative */}
            <LifeNarrative />

            {/* Milestone Tracker */}
            {areasData && <MilestoneTracker areasData={areasData} />}

            {/* Achievement Gallery */}
            <div className="mb-4 sm:mb-6">
              {stats ? <AchievementGallery achievements={stats.achievements} /> : <LoadingCard title="이룸 갤러리" />}
            </div>

            {/* Achievement Trend */}
            <div className="mb-4 sm:mb-6">
              {achievementTrend ? <AchievementTrendChart data={achievementTrend} /> : <LoadingCard title="이룸 포인트 트렌드" />}
            </div>

            {/* Monthly Comparison + YouTube */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {stats ? <MonthlyComparisonChart data={stats.monthlyComparison} /> : <LoadingCard title="월간 비교" />}
              <YouTubeSection />
            </div>

            {/* Relation Network */}
            <div>
              {relationData ? <RelationNetwork data={relationData} /> : <LoadingCard title="관계 네트워크" />}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <QuickRecordFAB />
    </main>
  );
}
