"use client";

import { useEffect, useCallback } from "react";

type TabKey = "today" | "records" | "analysis" | "growth";

interface KeyboardShortcutsOptions {
  onTabChange?: (tab: TabKey) => void;
  onSearchFocus?: () => void;
  onQuickRecord?: () => void;
}

const TAB_MAP: Record<string, TabKey> = {
  "1": "today",
  "2": "records",
  "3": "analysis",
  "4": "growth",
};

export function useKeyboardShortcuts({
  onTabChange,
  onSearchFocus,
  onQuickRecord,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Cmd+K / Ctrl+K -> search focus
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onSearchFocus?.();
        return;
      }

      // Cmd+N / Ctrl+N -> quick record
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        onQuickRecord?.();
        return;
      }

      // Skip number shortcuts when in input fields
      if (isInput) return;

      // 1-4 -> tab switching
      const tab = TAB_MAP[e.key];
      if (tab && onTabChange) {
        e.preventDefault();
        onTabChange(tab);
      }
    },
    [onTabChange, onSearchFocus, onQuickRecord],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
