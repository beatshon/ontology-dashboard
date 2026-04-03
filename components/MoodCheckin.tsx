"use client";

import { useState, useEffect } from "react";

interface MoodOption {
  emoji: string;
  label: string;
  value: string;
}

const MOODS: MoodOption[] = [
  { emoji: "😊", label: "좋음", value: "good" },
  { emoji: "🙂", label: "보통", value: "okay" },
  { emoji: "😐", label: "무난", value: "neutral" },
  { emoji: "😔", label: "아쉬움", value: "sad" },
  { emoji: "😢", label: "힘듦", value: "hard" },
];

function getTodayKey(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `mood_${today}`;
}

interface MoodData {
  mood: string;
  comment: string;
  timestamp: string;
}

export default function MoodCheckin() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load today's mood from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getTodayKey());
      if (stored) {
        const data: MoodData = JSON.parse(stored);
        setSelectedMood(data.mood);
        setComment(data.comment);
        setSaved(true);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const handleMoodClick = (value: string) => {
    if (saved && selectedMood === value) return;

    setSelectedMood(value);
    setShowInput(true);
    setSaved(false);
  };

  const handleSave = () => {
    if (!selectedMood) return;

    const data: MoodData = {
      mood: selectedMood,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(getTodayKey(), JSON.stringify(data));
    } catch {
      // storage full
    }

    setSaved(true);
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div className="toss-card mood-checkin-enter">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">💭</span>
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-widest">
          오늘의 기분
        </h3>
        {saved && (
          <span className="text-[10px] text-green-500 ml-auto mood-saved-badge">저장됨</span>
        )}
      </div>

      {/* Mood buttons row */}
      <div className="flex items-center gap-2 sm:gap-3">
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.value;
          return (
            <button
              key={mood.value}
              onClick={() => handleMoodClick(mood.value)}
              className={`flex flex-col items-center gap-1 px-3 sm:px-4 py-2 rounded-2xl transition-all duration-300 btn-press ${
                isSelected
                  ? "bg-amber-500/10 border border-amber-500/20 mood-selected"
                  : "bg-transparent border border-transparent hover:bg-white/5"
              }`}
              style={{
                transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: isSelected ? "scale(1.1)" : "scale(1)",
              }}
            >
              <span className={`text-xl sm:text-2xl transition-transform duration-300 ${isSelected ? "scale-110" : ""}`}>
                {mood.emoji}
              </span>
              <span className={`text-[10px] ${isSelected ? "text-amber-200" : "text-gray-500"}`}>
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Comment input (shown after mood selection, before save) */}
      {showInput && !saved && (
        <div className="mt-4 flex gap-2 mood-input-enter">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="오늘 한 줄 코멘트"
            className="flex-1 bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/30 transition"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 px-4 py-2.5 rounded-xl text-sm font-medium transition hover:from-amber-500/30 hover:to-orange-500/30 btn-press"
          >
            저장
          </button>
        </div>
      )}

      {/* Saved comment display */}
      {saved && comment && (
        <p className="mt-3 text-xs text-gray-500 pl-1">
          &ldquo;{comment}&rdquo;
        </p>
      )}
    </div>
  );
}
