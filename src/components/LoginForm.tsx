"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function LoginForm() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error || "Login gagal");
      router.replace("/");
    } catch (e) { setError(e instanceof Error ? e.message : "Terjadi kesalahan"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <label className="block text-sm">Email admin<input className="field mt-2" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
    <label className="block text-sm">Password<input className="field mt-2" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
    {error && <p className="text-sm text-red-400">{error}</p>}
    <button className="btn w-full" disabled={busy}>{busy ? "Memproses..." : "Masuk"}</button>
  </form>;
}
