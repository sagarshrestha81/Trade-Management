"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, User, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Create account</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Get started with Investment Tracker App</p>
        </div>

        <Card className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-medium text-rose-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-medium text-emerald-400">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-semibold text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a]/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="text-xs font-semibold text-slate-300">
                Password
              </label>
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
              Register Portfolio
            </Button>
          </form>
        </Card>

        <div className="text-center text-xs text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
