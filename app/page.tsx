import { AREAS, fetchAreaData, fetchAchievements } from "@/lib/notion";
import StatsChart from "@/components/StatsChart";
import AreaCard from "@/components/AreaCard";
import AchievementGallery from "@/components/AchievementGallery";

export const revalidate = 300; // 5분마다 갱신

export default async function Dashboard() {
  const [areasData, achievements] = await Promise.all([
    Promise.all(AREAS.map((a) => fetchAreaData(a, 5))),
    fetchAchievements(20),
  ]);

  const stats = areasData.map((d) => ({
    area: d.area.key,
    emoji: d.area.emoji,
    count: d.total,
    color: d.area.color,
  }));

  const now = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            온톨로지 대시보드
          </h1>
          <p className="text-[#555] mt-1 text-sm">제이스의 삶의 기록</p>
        </div>
        <span className="text-xs text-[#444]">{now}</span>
      </div>

      {/* Stats 차트 */}
      <div className="mb-8">
        <StatsChart stats={stats} />
      </div>

      {/* 영역 카드 그리드 */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest mb-4">
          7가지 영역
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {areasData.map((data) => (
            <AreaCard key={data.area.key} data={data} />
          ))}
        </div>
      </div>

      {/* 이룸 갤러리 */}
      <div className="mt-8">
        <AchievementGallery achievements={achievements} />
      </div>
    </main>
  );
}
