"use client";

import { useEffect, useState } from "react";

interface ChannelData {
  name: string;
  emoji: string;
  date: string;
  subscribers: string;
  views: string;
  videos: string;
  best: string;
}

export default function YouTubeSection() {
  const [channels, setChannels] = useState<ChannelData[] | null>(null);

  useEffect(() => {
    fetch("/api/youtube")
      .then((r) => r.json())
      .then((d) => setChannels(d.channels || []))
      .catch(() => setChannels([]));
  }, []);

  if (channels === null) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6 animate-pulse">
        <h2 className="text-base sm:text-lg font-bold mb-4">📺 YouTube</h2>
        <div className="h-24 bg-[#222] rounded"></div>
      </div>
    );
  }

  if (channels.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-4 sm:p-6">
      <h2 className="text-lg font-bold mb-4">📺 YouTube 채널</h2>

      <div className="space-y-4">
        {channels.map((ch) => (
          <div key={ch.name} className="rounded-xl bg-[#222] p-4 border border-gray-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-200">
                {ch.emoji} {ch.name}
              </span>
              <span className="text-[10px] text-gray-600">{ch.date}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {ch.subscribers && (
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {ch.subscribers.replace("구독자 ", "").replace("명", "")}
                  </div>
                  <div className="text-[10px] text-gray-500">구독자</div>
                </div>
              )}
              {ch.views && (
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {ch.views.replace("총 조회수 ", "").replace("회", "")}
                  </div>
                  <div className="text-[10px] text-gray-500">조회수</div>
                </div>
              )}
              {ch.videos && (
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {ch.videos.replace("영상 ", "").replace("개", "")}
                  </div>
                  <div className="text-[10px] text-gray-500">영상</div>
                </div>
              )}
            </div>

            {ch.best && (
              <div className="text-[10px] text-gray-500 mt-1">
                🏆 {ch.best.slice(0, 40)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
