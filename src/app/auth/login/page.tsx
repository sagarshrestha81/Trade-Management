"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store basic user profile in localStorage for client-side state
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090e1a] px-4 py-12 relative overflow-hidden">
      {/* Background blobs for premium depth */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white mb-3 shadow-lg shadow-blue-500/30">
            <TrendingUp size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Access your investment brokerage dashboard</p>
        </div>

        <Card className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-medium text-rose-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a]/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a]/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={isLoading}>
              Sign In to Portfolio
            </Button>
          </form>
        </Card>

        <div className="text-center text-xs text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
