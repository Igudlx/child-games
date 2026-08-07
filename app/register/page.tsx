"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RobotGraphic } from "@/components/RobotGraphic";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
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
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          className="bg-black border border-white/30 rounded-md px-4 py-3 outline-none focus:border-white transition-colors"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          className="bg-black border border-white/30 rounded-md px-4 py-3 outline-none focus:border-white transition-colors"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        {error && <p className="text-sm text-white/70 border border-white/20 rounded-md p-2">{error}</p>}
        <button type="submit" disabled={loading} className="outline-btn mt-2">
          {loading ? "Creating Account..." : "Create Account"}
        </button>
        <p className="text-center text-sm text-ghost">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
