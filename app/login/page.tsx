"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      window.location.href = "/";
    } else {
      setError("비밀번호가 올바르지 않습니다.");
      setLoading(false);
    }
  };

  return (
    <html lang="ko">
      <body style={{ margin: 0, background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, sans-serif" }}>
        <div style={{ background: "#1a1a1a", borderRadius: 16, padding: "40px 32px", width: 340, textAlign: "center" }}>
          <h1 style={{ color: "#e5e5e5", fontSize: 20, marginBottom: 8 }}>온톨로지 대시보드</h1>
          <p style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>비밀번호를 입력하세요</p>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoFocus
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #333",
                borderRadius: 8,
                background: "#111",
                color: "#e5e5e5",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />
            {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: "100%",
                padding: "12px 0",
                background: password ? "#3b82f6" : "#333",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: password ? "pointer" : "default",
              }}
            >
              {loading ? "확인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </body>
    </html>
  );
}
