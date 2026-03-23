"use client";

import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "대시보드", emoji: "📊" },
  { href: "/goals", label: "목표", emoji: "🎯" },
  { href: "https://beatshon.github.io", label: "블로그", emoji: "✍️", external: true },
  { href: "/lite", label: "Lite", emoji: "📱" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* 데스크톱 상단 네비 */}
      <nav className="hidden sm:flex gap-1 mb-6 border-b border-[#222] pb-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const isExternal = "external" in item && item.external;
          return (
            <a
              key={item.href}
              href={item.href}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                isActive
                  ? "bg-[#333] text-white"
                  : "text-[#666] hover:text-[#999] hover:bg-[#1a1a1a]"
              }`}
            >
              {item.emoji} {item.label}
            </a>
          );
        })}
      </nav>

      {/* 모바일 하단 고정 바 */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#222] z-50 safe-bottom">
        <div className="flex justify-around py-2 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const isExternal = "external" in item && item.external;
            return (
              <a
                key={item.href}
                href={item.href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? "text-white" : "text-[#666]"
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="text-[10px]">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* 모바일에서 하단 바 높이만큼 패딩 */}
      <div className="sm:hidden h-16" />
    </>
  );
}
