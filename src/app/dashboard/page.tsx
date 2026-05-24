"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, DollarSign, Percent, BarChart3, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import InvestmentPieChart from "@/components/charts/InvestmentPieChart";
import PortfolioGrowthChart from "@/components/charts/PortfolioGrowthChart";

interface InvestorBreakdown {
  name: string;
  investment: number;
  value: number;
  profit: number;
  roi: number;
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

interface DashboardStats {
  totalInvestment: number;
  totalPortfolioValue: number;
  totalProfit: number;
  roi: number;
  activeTradesCount: number;
  closedTradesCount: number;
  investors: InvestorBreakdown[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to load dashboard statistics");
        }
        const data = await res.json();
        setStats(data.stats);
        setAuditLogs(data.auditLogs);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090e1a] text-slate-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading brokerage statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#090e1a] text-slate-300 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-rose-500/30">
          <CardHeader>
            <CardTitle className="text-rose-400">Failed to Load Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer"
            >
              Retry Connection
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-formatted growth tracking data points for chart
  const growthData = [
    { date: "Jan 26", investment: 10000, value: 10000 },
    { date: "Feb 26", investment: 10000, value: 10800 },
    { date: "Mar 26", investment: 10000, value: 11500 },
    { date: "Apr 26", investment: 18000, value: 20200 },
    { date: "May 26", investment: stats?.totalInvestment || 18000, value: stats?.totalPortfolioValue || 22350 },
  ];

  const pieData = stats
    ? stats.investors.map((i) => ({ name: i.name, value: i.investment }))
    : [];

  const isProfit = (stats?.totalProfit || 0) >= 0;

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-300 pl-64 flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Top Header */}
        <div className="flex flex-col gap-1.5 border-b border-[var(--card-border)] pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-500">
            <TrendingUp size={14} /> Brokerage Account Overview
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Investment Dashboard</h1>
        </div>

        {/* 4 Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Portfolio Value */}
          <Card className="glass-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">Portfolio net Asset Value</span>
              <div className="rounded-lg bg-blue-600/10 p-2 text-blue-400 border border-blue-500/20">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white">${stats?.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Stock holdings + unallocated cash</p>
            </div>
          </Card>

          {/* Card 2: Net Investment */}
          <Card className="glass-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">Total Contributed Capital</span>
              <div className="rounded-lg bg-slate-600/10 p-2 text-slate-400 border border-slate-500/20">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white">${stats?.totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Capital pooled across active trades</p>
            </div>
          </Card>

          {/* Card 3: Profit/Loss */}
          <Card className="glass-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">Net Unrealized Profit/Loss</span>
              <div className={`rounded-lg p-2 border ${
                isProfit
                  ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-600/10 text-rose-400 border-rose-500/20"
              }`}>
                {isProfit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-2xl font-bold ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                {isProfit ? "+" : "-"}${Math.abs(stats?.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1">Calculated in real-time across stocks</p>
            </div>
          </Card>

          {/* Card 4: ROI */}
          <Card className="glass-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">Portfolio return on Invest (ROI)</span>
              <div className="rounded-lg bg-amber-600/10 p-2 text-amber-400 border border-amber-500/20">
                <Percent size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-2xl font-bold ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                {isProfit ? "+" : ""}{(stats?.roi || 0).toFixed(2)}%
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1">Weighted return on net capital</p>
            </div>
          </Card>
        </div>

        {/* Charts & Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400" />
                <CardTitle>Historical growth track</CardTitle>
              </div>
              <CardDescription>Track portfolio value vs contributed cash over time</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioGrowthChart data={growthData} />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                <CardTitle>Investor allocations</CardTitle>
              </div>
              <CardDescription>Breakdown of contributed cash by investor</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <InvestmentPieChart data={pieData} />
            </CardContent>
          </Card>
        </div>

        {/* Investor Proportions Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                <CardTitle>Investor ROI Breakdown</CardTitle>
              </div>
              <span className="text-xs rounded-full bg-blue-600/10 text-blue-400 px-3 py-1 border border-blue-500/20 font-semibold uppercase">
                Proportional Projections
              </span>
            </div>
            <CardDescription>Active trade holdings split proportionally based on exact individual capital contributions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor Name</TableHead>
                  <TableHead>Contributed Cash</TableHead>
                  <TableHead>Current value</TableHead>
                  <TableHead>Proportional Profit</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.investors.map((investor) => {
                  const hasProfit = investor.profit >= 0;
                  return (
                    <TableRow key={investor.name}>
                      <TableCell className="font-semibold text-white">{investor.name}</TableCell>
                      <TableCell>${investor.investment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-slate-100">${investor.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className={hasProfit ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                        {hasProfit ? "+" : "-"}${Math.abs(investor.profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${hasProfit ? "text-emerald-400" : "text-rose-400"}`}>
                        {hasProfit ? "+" : ""}{investor.roi.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Audit Activities */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-blue-400" />
              <CardTitle>Recent Account Actions</CardTitle>
            </div>
            <CardDescription>Full audit logs tracking capital shifts, trades, and rollovers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flow-root">
              <ul className="-mb-8">
                {auditLogs.map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {logIdx !== auditLogs.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-[var(--card-border)]" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-[#1c2842] border border-[var(--card-border)] flex items-center justify-center ring-8 ring-[#090e1a] text-blue-400 text-xs font-semibold">
                            {log.action.substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-slate-300">
                              <span className="font-semibold text-white">{log.action}</span>: {log.details}
                            </p>
                          </div>
                          <div className="text-right text-[11px] whitespace-nowrap text-[var(--muted)]">
                            {new Date(log.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
