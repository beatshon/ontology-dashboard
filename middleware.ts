import { NextRequest, NextResponse } from "next/server";

const PASSWORD = process.env.DASHBOARD_PASSWORD ?? "jace1004";
const COOKIE_NAME = "onto_auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 로그인 페이지와 인증 API는 통과
  if (pathname === "/login" || pathname === "/api/auth" || pathname === "/lite") {
    return NextResponse.next();
  }

  // 쿠키 체크
  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value === PASSWORD) {
    return NextResponse.next();
  }

  // 인증 안 됨 → 로그인 페이지로 리다이렉트
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|icon-|manifest|dayone-map).*)"],
};
