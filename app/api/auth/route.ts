export const runtime = "edge";

const PASSWORD = process.env.DASHBOARD_PASSWORD ?? "jace1004";
const COOKIE_NAME = "onto_auth";
const MAX_AGE = 86400 * 7; // 7일

export async function POST(req: Request) {
  const body = await req.json();
  const password = body?.password ?? "";

  if (password === PASSWORD) {
    // 간단한 토큰 생성 (비밀번호 해시)
    const encoder = new TextEncoder();
    const data = encoder.encode(PASSWORD + Date.now().toString());
    const hash = await crypto.subtle.digest("SHA-256", data);
    const token = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `${COOKIE_NAME}=${password};Path=/;HttpOnly;Secure;SameSite=Lax;Max-Age=${MAX_AGE}`,
      },
    });
  }

  return new Response(JSON.stringify({ ok: false }), { status: 401 });
}
