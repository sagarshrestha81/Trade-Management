"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Search, Filter, ArrowUpRight, ArrowDownRight, Clock, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

interface LedgerTransaction {
  id: string;
  amount: number;
  type: string; // DEPOSIT, WITHDRAWAL, ROLLOVER
  description: string;
  date: string;
  trade: {
    name: string;
  };
  investor: {
    name: string;
  };
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  trade?: {
    name: string;
  } | null;
}

export default function AuditLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [txs, setTxs] = useState<LedgerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    async function fetchLedgerData() {
      try {
        const statsRes = await fetch("/api/dashboard/stats");
        if (statsRes.status === 401) {
          router.push("/auth/login");
          return;
        }

        const data = await statsRes.json();
        setLogs(data.auditLogs);

        // Fetch detailed transactions list from trades
        const tradesRes = await fetch("/api/trades");
        if (tradesRes.ok) {
          const tradesData = await tradesRes.json();
          const allTxs: LedgerTransaction[] = [];
          
          tradesData.trades.forEach((trade: any) => {
            trade.investors.forEach((investor: any) => {
              investor.transactions.forEach((tx: any) => {
                allTxs.push({
                  id: tx.id,
                  amount: tx.amount,
                  type: tx.type,
                  description: tx.description || "Capital Adjustment",
                  date: tx.date,
                  trade: { name: trade.name },
                  investor: { name: investor.name },
                });
              });
            });
          });

          // Sort transactions by date descending
          allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTxs(allTxs);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLedgerData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090e1a] text-slate-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading ledger records...</p>
        </div>
      </div>
    );
  }

  // Filter transactions based on search and type
  const filteredTxs = txs.filter((tx) => {
    const matchesSearch =
      tx.investor.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.trade.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.description.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filterType === "ALL" || tx.type === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-300 pl-64 flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col gap-1.5 border-b border-[var(--card-border)] pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-500">
            <Receipt size={14} /> Account Auditing Ledger
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Audit Log & History</h1>
        </div>

        {/* Filters and search controllers */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-xl">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by investor name, trade name or memo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
              <Filter size={14} /> Filter type:
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">ALL LEDGERS</option>
              <option value="DEPOSIT">DEPOSITS ONLY</option>
              <option value="WITHDRAWAL">WITHDRAWALS ONLY</option>
              <option value="ROLLOVER">ROLLOVERS ONLY</option>
            </select>
          </div>
        </div>

        {/* Section 1: Detailed Capital Ledger Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-blue-400" />
              <CardTitle>Capital Transaction History</CardTitle>
            </div>
            <CardDescription>Chronological journal of deposits, withdrawals, and proportional rollover cash flows</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Execution Date</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Trade Book</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description / Memo</TableHead>
                  <TableHead className="text-right">Capital Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTxs.map((tx) => {
                  const isPositive = tx.amount >= 0;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-semibold text-slate-300">
                        {new Date(tx.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-semibold text-white">{tx.investor.name}</TableCell>
                      <TableCell>{tx.trade.name}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold tracking-wider uppercase ${
                          tx.type === "DEPOSIT"
                            ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20"
                            : tx.type === "WITHDRAWAL"
                            ? "bg-rose-600/10 text-rose-400 border-rose-500/20"
                            : "bg-blue-600/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400 max-w-xs truncate">{tx.description}</TableCell>
                      <TableCell className={`text-right font-bold flex items-center justify-end gap-0.5 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {isPositive ? "+" : "-"}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredTxs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-[var(--muted)]">
                      No matching capital transactions found in ledger.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Section 2: Complete Audit Activity logs */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-blue-400" />
              <CardTitle>System Activity Audit Log</CardTitle>
            </div>
            <CardDescription>Security audit trailing of all system alterations, allocations, and trade events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flow-root">
              <ul className="-mb-8">
                {logs.map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {logIdx !== logs.length - 1 ? (
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
                              second: "2-digit",
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
