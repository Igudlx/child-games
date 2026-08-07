"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RobotGraphic } from "@/components/RobotGraphic";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
      <RobotGraphic className="w-16 h-20 opacity-80 animate-float" />
      <h1 className="font-display font-black text-3xl tracking-widest">CHILD GAMES</h1>

      <form onSubmit={handleSubmit} className="panel w-full max-w-sm p-8 flex flex-col gap-4">
        <input
          className="bg-black border border-white/30 rounded-md px-4 py-3 outline-none focus:border-white transition-colors"
          placeholder="Username or Email"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          className="bg-black border border-white/30 rounded-md px-4 py-3 outline-none focus:border-white transition-colors"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="text-sm text-white/70 border border-white/20 rounded-md p-2">{error}</p>}
        <button type="submit" disabled={loading} className="outline-btn mt-2">
          {loading ? "Signing In..." : "Sign In"}
        </button>
        <p className="text-center text-sm text-ghost">
          No account?{" "}
          <Link href="/register" className="text-white underline underline-offset-4">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
