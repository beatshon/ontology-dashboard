"use client";

import { useEffect } from "react";

export default function TitleBadge() {
  useEffect(() => {
    const updateTitle = () => {
      fetch("/api/timeline")
        .then((r) => r.json())
        .then((d) => {
          const today = new Date().toISOString().slice(0, 10);
          const todayCount = (d.entries || []).filter(
            (e: { date: string }) => e.date === today
          ).length;

          if (todayCount > 0) {
            document.title = `(${todayCount}) 온톨로지 대시보드`;
          } else {
            document.title = "온톨로지 대시보드";
          }
        })
        .catch(() => {});
    };

    updateTitle();
    const interval = setInterval(updateTitle, 5 * 60 * 1000); // 5분
    return () => clearInterval(interval);
  }, []);

  return null;
}
