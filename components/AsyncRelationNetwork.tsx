"use client";

import { useEffect, useState } from "react";
import type { RelationNode } from "@/types";
import RelationNetwork from "./RelationNetwork";

export default function AsyncRelationNetwork() {
  const [data, setData] = useState<RelationNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/relation")
      .then((r) => r.json())
      .then((d: RelationNode[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#111] rounded-xl p-6 border border-[#222]">
        <h2 className="text-lg font-semibold text-white mb-4">🤝 관계 네트워크</h2>
        <p className="text-[#555] text-sm">로딩 중...</p>
      </div>
    );
  }

  return <RelationNetwork data={data} />;
}
