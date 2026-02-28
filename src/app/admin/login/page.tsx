"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push(from);
    } else {
      setError("Invalid password.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 380, background: "#181818", border: "1px solid #222222", borderTop: "3px solid #FF5C00", padding: "48px 40px" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 2, color: "#F5F2ED", marginBottom: 6 }}>
          HEY<span style={{ color: "#FF5C00" }}>.</span>MORE LEADS
        </div>
        <div style={{ fontSize: 13, color: "#888880", marginBottom: 36, fontWeight: 300 }}>Admin Dashboard</div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              autoFocus
              style={{ background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED", padding: "14px 18px", fontSize: 15, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#FF5C00"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,92,0,0.15)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#2C2C2C"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          {error && <div style={{ fontSize: 13, color: "#EF4444", padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background: loading ? "#222" : "#FF5C00", color: loading ? "#888880" : "#0A0A0A", padding: "14px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
            {loading ? "Checking..." : "Enter Dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
