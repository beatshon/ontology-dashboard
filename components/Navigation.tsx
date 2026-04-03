"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type TabKey = "today" | "records" | "analysis" | "growth";

const NAV_ITEMS = [
  { href: "/", label: "대시보드", emoji: "📊" },
  { href: "/goals", label: "목표", emoji: "🎯" },
  { href: "https://beatshon.github.io", label: "블로그", emoji: "✍️", external: true },
  { href: "/lite", label: "Lite", emoji: "📱" },
];

const TAB_ITEMS: { key: TabKey; label: string; icon: string; activeIcon: string }[] = [
  { key: "today", label: "오늘", icon: "○", activeIcon: "●" },
  { key: "records", label: "기록", icon: "☐", activeIcon: "☑" },
  { key: "analysis", label: "분석", icon: "◇", activeIcon: "◆" },
  { key: "growth", label: "성장", icon: "△", activeIcon: "▲" },
];

interface NavigationProps {
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
}

export default function Navigation({ activeTab = "today", onTabChange }: NavigationProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isDashboard = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Desktop top nav - minimal sticky header */}
      <nav
        className={`hidden sm:block sticky top-0 z-40 transition-all duration-300 mb-4 ${
          scrolled ? "nav-sticky-active" : ""
        }`}
        style={{
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
          backgroundColor: scrolled ? "rgba(13,13,13,0.9)" : "transparent",
          marginLeft: scrolled ? "-1.5rem" : "0",
          marginRight: scrolled ? "-1.5rem" : "0",
          paddingLeft: scrolled ? "1.5rem" : "0",
          paddingRight: scrolled ? "1.5rem" : "0",
          paddingTop: scrolled ? "0.75rem" : "0",
          paddingBottom: scrolled ? "0.75rem" : "0",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        }}
      >
        <div className="flex items-center justify-between">
          {/* Page nav links */}
          <div className="flex gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const isExternal = "external" in item && item.external;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`px-3 py-1.5 text-xs rounded-xl transition-all duration-200 btn-press ${
                    isActive
                      ? "bg-white/10 text-white font-medium"
                      : "text-[#666] hover:text-[#999] hover:bg-white/5"
                  }`}
                >
                  {item.emoji} {item.label}
                </a>
              );
            })}
          </div>

          {/* Tab pills (dashboard only) */}
          {isDashboard && onTabChange && (
            <div className="flex gap-1 bg-[#111] rounded-2xl p-1 border border-white/5">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`px-4 py-1.5 text-xs rounded-xl transition-all duration-300 btn-press ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 font-semibold shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                  style={{
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar (Toss-style) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          backgroundColor: "rgba(13,13,13,0.92)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {isDashboard && onTabChange ? (
          <div className="flex justify-around py-2 pb-[env(safe-area-inset-bottom)]">
            {TAB_ITEMS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-300"
                  style={{
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <span className={`text-base transition-all duration-300 ${
                    isActive ? "text-amber-400" : "text-gray-600"
                  }`}>
                    {isActive ? tab.activeIcon : tab.icon}
                  </span>
                  <span className={`text-[10px] font-medium transition-colors duration-200 ${
                    isActive ? "text-amber-400" : "text-gray-600"
                  }`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="block w-4 h-0.5 bg-amber-400 rounded-full bottom-tab-active" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex justify-around py-2 pb-[env(safe-area-inset-bottom)]">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const isExternal = "external" in item && item.external;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors btn-press ${
                    isActive ? "text-amber-400" : "text-[#666]"
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-[10px]">{item.label}</span>
                </a>
              );
            })}
          </div>
        )}
      </nav>

      {/* Mobile bottom bar spacer */}
      <div className="sm:hidden h-16" />
    </>
  );
}
