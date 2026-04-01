"use client";

import { useEffect, useState } from "react";
import type { RelationNode } from "@/types";
import Link from "next/link";

function getRecencyLabel(lastContact: string): { text: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSince = Math.floor(
    (today.getTime() - new Date(lastContact).getTime()) / 86400000
  );

  if (daysSince <= 7) return { text: `${daysSince}일 전`, color: "text-emerald-400" };
  if (daysSince <= 14) return { text: `${daysSince}일 전`, color: "text-blue-400" };
  if (daysSince <= 30) return { text: `${daysSince}일 전`, color: "text-amber-400" };
  return { text: `${daysSince}일 전`, color: "text-red-400" };
}

function getSentimentIcon(avgSentiment: number): string {
  if (avgSentiment > 0.2) return "😊";
  if (avgSentiment < -0.2) return "😟";
  return "😐";
}

function getSuggestedAction(node: RelationNode): string {
  const today = new Date();
  const daysSince = Math.floor(
    (today.getTime() - new Date(node.lastContact).getTime()) / 86400000
  );

  if (node.avgSentiment < -0.2 && daysSince > 14) {
    return "감정이 부정적으로 흐르고 있어요. 따뜻한 안부 메시지를 보내보세요.";
  }
  if (daysSince > 30) {
    return "한 달 넘게 소식이 없어요. 커피 한 잔 제안해보세요.";
  }
  if (daysSince > 14) {
    return "2주 이상 연락이 없어요. 짧은 근황 공유가 좋겠어요.";
  }
  return "관계 유지를 위해 정기적인 연락을 계속하세요.";
}

export default function DriftAlerts() {
  const [relations, setRelations] = useState<RelationNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/relation")
      .then((r) => r.json())
      .then((data) => {
        setRelations(data.nodes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold mb-6">관계 드리프트 알림</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const drifting = relations.filter((r) => r.isDrifting);
  const atRisk = relations.filter(
    (r) => !r.isDrifting && r.strengthScore < 0.4
  );
  const healthy = relations.filter(
    (r) => !r.isDrifting && r.strengthScore >= 0.4
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">관계 드리프트 알림</h1>
          <Link
            href="/"
            className="text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            대시보드로 돌아가기
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{drifting.length}</p>
            <p className="text-xs text-red-400/60 mt-1">드리프트 경고</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{atRisk.length}</p>
            <p className="text-xs text-amber-400/60 mt-1">주의 필요</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{healthy.length}</p>
            <p className="text-xs text-emerald-400/60 mt-1">건강한 관계</p>
          </div>
        </div>

        {/* Drifting */}
        {drifting.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <span>⚠️</span> 드리프트 경고
            </h2>
            <div className="space-y-3">
              {drifting.map((node) => {
                const recency = getRecencyLabel(node.lastContact);
                return (
                  <div
                    key={node.name}
                    className="rounded-xl border border-red-500/20 bg-red-500/5 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getSentimentIcon(node.avgSentiment)}
                        </span>
                        <span className="font-medium">{node.name}</span>
                        {node.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                            {node.category}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${recency.color}`}>
                        {recency.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${node.strengthScore * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/30">
                        {Math.round(node.strengthScore * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-white/50 bg-white/5 rounded-lg p-2">
                      💡 {getSuggestedAction(node)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* At Risk */}
        {atRisk.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-amber-400 mb-3">
              주의 필요
            </h2>
            <div className="space-y-2">
              {atRisk.map((node) => {
                const recency = getRecencyLabel(node.lastContact);
                return (
                  <div
                    key={node.name}
                    className="rounded-xl border border-white/5 bg-white/5 p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span>{getSentimentIcon(node.avgSentiment)}</span>
                      <span className="text-sm">{node.name}</span>
                      {node.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">
                          {node.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${node.strengthScore * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs ${recency.color}`}>
                        {recency.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Healthy */}
        {healthy.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-emerald-400 mb-3">
              건강한 관계
            </h2>
            <div className="space-y-2">
              {healthy.slice(0, 10).map((node) => {
                const recency = getRecencyLabel(node.lastContact);
                return (
                  <div
                    key={node.name}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span>{getSentimentIcon(node.avgSentiment)}</span>
                      <span className="text-sm text-white/70">{node.name}</span>
                    </div>
                    <span className={`text-xs ${recency.color}`}>
                      {recency.text}
                    </span>
                  </div>
                );
              })}
              {healthy.length > 10 && (
                <p className="text-xs text-white/30 text-center pt-2">
                  외 {healthy.length - 10}명
                </p>
              )}
            </div>
          </section>
        )}

        {relations.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <p className="text-lg mb-2">관계 데이터가 없습니다</p>
            <p className="text-sm">온톨로지 봇이 관계 기록을 쌓으면 여기에 표시됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
