import { NextResponse } from "next/server";

// Basic Auth 비활성화 — 필요 시 DASHBOARD_PASSWORD 환경변수 설정으로 재활성화
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
