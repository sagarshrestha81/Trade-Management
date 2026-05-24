"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, BarChart3, Plus, ArrowUpRight, ArrowDownRight, FolderClosed, DollarSign, Calendar, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface TradeItem {
  id: string;
  name: string;
  status: string; // ACTIVE, CLOSED
  totalInvestment: number;
  totalPortfolioValue: number;
  totalProfit: number;
  roi: number;
  createdAt: string;
}

export default function TradesListPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New trade modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTradeName, setNewTradeName] = useState("");
  const [ownerInitialDeposit, setOwnerInitialDeposit] = useState("5000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchTrades() {
    try {
      const res = await fetch("/api/trades");
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load trades");
      }
      const data = await res.json();
      setTrades(data.trades);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTrades();
  }, [router]);

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTradeName) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTradeName,
          ownerInitialDeposit: parseFloat(ownerInitialDeposit) || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create trade");
      }

      setNewTradeName("");
      setOwnerInitialDeposit("5000");
      setIsModalOpen(false);
      fetchTrades();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090e1a] text-slate-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading trades history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-300 pl-64 flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-500">
              <BarChart3 size={14} /> Trade Portfolio Manager
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Trades & Rollovers</h1>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 cursor-pointer">
            <Plus size={16} /> New Trade Book
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Dynamic Trade Grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trades.map((trade) => {
            const isProfit = trade.totalProfit >= 0;
            const isActive = trade.status === "ACTIVE";
            
            return (
              <Card key={trade.id} className="glass-card hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {trade.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1.5">
                        <Calendar size={12} /> Established {new Date(trade.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </CardDescription>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                      isActive
                        ? "bg-blue-600/10 text-blue-400 border-blue-500/20"
                        : "bg-slate-600/10 text-slate-400 border-slate-500/20"
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 border-t border-[var(--card-border)]/60">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--muted)]">Total invested</p>
                      <p className="text-sm font-semibold text-white mt-1">${trade.totalInvestment.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--muted)]">Portfolio net</p>
                      <p className="text-sm font-semibold text-white mt-1">${trade.totalPortfolioValue.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--muted)]">Accumulate Profit</p>
                      <p className={`text-sm font-bold mt-1 flex items-center gap-0.5 ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                        {isProfit ? "+" : "-"}${Math.abs(trade.totalProfit).toLocaleString()}
                        {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--card-border)]/40">
                    <span className={`text-xs font-bold ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                      {isProfit ? "+" : ""}{trade.roi.toFixed(2)}% ROI
                    </span>

                    <Link
                      href={`/dashboard/trades/${trade.id}`}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                    >
                      Configure Assets & Shares <ChevronRight size={14} />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {trades.length === 0 && (
            <div className="md:col-span-2 text-center py-16 border border-dashed border-[var(--card-border)] rounded-xl bg-[var(--card-bg)]/40">
              <FolderClosed size={48} className="mx-auto text-[var(--muted)] mb-3" />
              <h3 className="text-lg font-semibold text-white">No investment trades recorded</h3>
              <p className="text-sm text-[var(--muted)] mt-1">Create a trade book to start logging multi-investor and stock tracking data.</p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-4 flex items-center gap-2 mx-auto cursor-pointer">
                <Plus size={16} /> Seed first trade
              </Button>
            </div>
          )}
        </div>

        {/* Modal: New Trade creation */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Trade Book"
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" form="create-trade-form" isLoading={isSubmitting}>
                Establish Trade
              </Button>
            </div>
          }
        >
          <form id="create-trade-form" onSubmit={handleCreateTrade} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="tradeName" className="text-xs font-semibold text-slate-300">
                Trade Book Name
              </label>
              <input
                id="tradeName"
                type="text"
                placeholder="e.g. Trade 2 (Active Tech Portfolio)"
                required
                value={newTradeName}
                onChange={(e) => setNewTradeName(e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="ownerDeposit" className="text-xs font-semibold text-slate-300">
                Owner Initial Deposit ($)
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="ownerDeposit"
                  type="number"
                  placeholder="5000"
                  required
                  value={ownerInitialDeposit}
                  onChange={(e) => setOwnerInitialDeposit(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-[var(--muted)]">Sets up default investor &quot;Owner (You)&quot; with initial capital. Proportions recompute automatically as others join.</p>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
