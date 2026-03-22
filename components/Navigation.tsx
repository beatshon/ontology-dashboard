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
    <nav className="flex gap-1 mb-6 border-b border-[#222] pb-3">
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
  );
}
