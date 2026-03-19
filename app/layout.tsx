import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "온톨로지 대시보드",
  description: "제이스의 삶의 기록",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#0d0d0d] text-[#e5e5e5]">{children}</body>
    </html>
  );
}
