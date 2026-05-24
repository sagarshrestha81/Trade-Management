"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  Percent,
  TrendingDown,
  Lock,
  RefreshCw,
  Users,
  Coins
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface Stock {
  id: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  cost: number;
  value: number;
  profit: number;
  roi: number;
}

interface Investor {
  id: string;
  name: string;
  totalDeposits: number;
  totalWithdrawals: number;
  netInvestment: number;
  sharePercentage: number;
  profitShare: number;
  currentValue: number;
}

interface Trade {
  id: string;
  name: string;
  status: string; // ACTIVE, CLOSED
  rolloverProfit: number;
  totalStockCost: number;
  totalStockValue: number;
  totalStockProfit: number;
  totalInvestment: number;
  cashBalance: number;
  totalPortfolioValue: number;
  totalProfit: number;
  roi: number;
  stocks: Stock[];
  investors: Investor[];
}

interface MiniTrade {
  id: string;
  name: string;
}

export default function TradeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: tradeId } = use(params);

  const [trade, setTrade] = useState<Trade | null>(null);
  const [activeTradesList, setActiveTradesList] = useState<MiniTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals visibility state
  const [activeModal, setActiveModal] = useState<
    "none" | "addStock" | "editStock" | "addInvestor" | "recordTx" | "closeTrade"
  >("none");

  // Selection states for updates
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

  // Stock Form state
  const [stockName, setStockName] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [stockBuy, setStockBuy] = useState("");
  const [stockCurrent, setStockCurrent] = useState("");

  // Investor Form state
  const [investorName, setInvestorName] = useState("");
  const [investorDeposit, setInvestorDeposit] = useState("");

  // Transaction Form state
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
  const [txDesc, setTxDesc] = useState("");

  // Rollover Form state
  const [targetTradeId, setTargetTradeId] = useState("");

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch single trade details
  async function fetchTradeDetails() {
    try {
      const res = await fetch(`/api/trades/${tradeId}`);
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load trade data");
      }
      const data = await res.json();
      setTrade(data.trade);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch active trades for rollover target choice
  async function fetchActiveTrades() {
    try {
      const res = await fetch("/api/trades");
      if (res.ok) {
        const data = await res.json();
        const activeList = data.trades
          .filter((t: any) => t.id !== tradeId && t.status === "ACTIVE")
          .map((t: any) => ({ id: t.id, name: t.name }));
        setActiveTradesList(activeList);
        if (activeList.length > 0) {
          setTargetTradeId(activeList[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading active list:", err);
    }
  }

  useEffect(() => {
    fetchTradeDetails();
    fetchActiveTrades();
  }, [tradeId]);

  // STOCKS HANDLERS
  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}/stocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stockName,
          quantity: parseFloat(stockQty),
          buyPrice: parseFloat(stockBuy),
          currentPrice: parseFloat(stockCurrent),
        }),
      });

      if (!res.ok) throw new Error("Failed to add stock");
      
      // Reset & Refresh
      setStockName("");
      setStockQty("");
      setStockBuy("");
      setStockCurrent("");
      setActiveModal("none");
      fetchTradeDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    setIsActionLoading(true);

    try {
      const res = await fetch(`/api/trades/${tradeId}/stocks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: selectedStock.id,
          quantity: parseFloat(stockQty),
          buyPrice: parseFloat(stockBuy),
          currentPrice: parseFloat(stockCurrent),
        }),
      });

      if (!res.ok) throw new Error("Failed to update stock");

      setSelectedStock(null);
      setStockQty("");
      setStockBuy("");
      setStockCurrent("");
      setActiveModal("none");
      fetchTradeDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    if (!confirm("Are you sure you want to remove this stock holding?")) return;
    
    try {
      const res = await fetch(`/api/trades/${tradeId}/stocks?stockId=${stockId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete stock");
      fetchTradeDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // INVESTORS & TRANSACTIONS HANDLERS
  const handleAddInvestorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}/investors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: investorName,
          initialDeposit: parseFloat(investorDeposit) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add investor");

      setInvestorName("");
      setInvestorDeposit("");
      setActiveModal("none");
      fetchTradeDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRecordTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor) return;
    setIsActionLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeId,
          investorId: selectedInvestor.id,
          amount: parseFloat(txAmount),
          type: txType,
          description: txDesc,
        }),
      });

      if (!res.ok) throw new Error("Failed to record transaction");

      setSelectedInvestor(null);
      setTxAmount("");
      setTxDesc("");
      setActiveModal("none");
      fetchTradeDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteInvestor = async (investorId: string) => {
    if (!confirm("Removing an investor will erase all their deposit histories and proportional shares. Proceed?")) return;
    
    try {
      const res = await fetch(`/api/trades/${tradeId}/investors?investorId=${investorId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete investor");
      fetchTradeDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CLOSE & ROLLOVER HANDLERS
  const handleCloseTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);

    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CLOSED",
          rolloverTargetTradeId: targetTradeId || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to close trade book");

      setActiveModal("none");
      router.push("/dashboard/trades");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090e1a] text-slate-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-[#090e1a] text-slate-300 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Trade Book Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400">This trade book doesn&apos;t exist or belongs to another account.</p>
            <Link href="/dashboard/trades">
              <Button className="cursor-pointer">Return to Trades</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProfit = trade.totalProfit >= 0;
  const isActive = trade.status === "ACTIVE";

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-300 pl-64 flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto animate-fade-in">
        {/* Navigation back link */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/trades"
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Trade books
          </Link>
        </div>

        {/* Trade Title Header & Control Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--card-border)] pb-6 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{trade.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20"
                  : "bg-slate-600/10 text-slate-400 border-slate-500/20"
              }`}>
                {trade.status}
              </span>
            </div>
            {trade.rolloverProfit > 0 && (
              <p className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                <Coins size={12} /> Rolled over profits locked from previous trades: ${trade.rolloverProfit.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchTradeDetails} className="flex items-center gap-1.5 cursor-pointer">
              <RefreshCw size={14} /> Sync Live
            </Button>

            {isActive && (
              <Button
                variant="danger"
                onClick={() => setActiveModal("closeTrade")}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Lock size={14} /> Close & Rollover
              </Button>
            )}
          </div>
        </div>

        {/* Live Calculation cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Investment */}
          <Card className="glass-card">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)]">Trade Investment Capital</span>
            <h3 className="text-xl font-bold text-white mt-1.5">${trade.totalInvestment.toLocaleString()}</h3>
            <p className="text-[11px] text-[var(--muted)] mt-1">Sum of investor net contributions</p>
          </Card>

          {/* Card 2: Stock Portfolio value */}
          <Card className="glass-card">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)]">Active Stocks Value</span>
            <h3 className="text-xl font-bold text-white mt-1.5">${trade.totalStockValue.toLocaleString()}</h3>
            <p className="text-[11px] text-[var(--muted)] mt-1">Cost value basis: ${trade.totalStockCost.toLocaleString()}</p>
          </Card>

          {/* Card 3: Trade Profit/Loss */}
          <Card className="glass-card">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)]">Current Trade P/L</span>
            <h3 className={`text-xl font-bold mt-1.5 ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfit ? "+" : "-"}${Math.abs(trade.totalProfit).toLocaleString()}
            </h3>
            <p className="text-[11px] text-[var(--muted)] mt-1">Derived directly from holdings</p>
          </Card>

          {/* Card 4: ROI */}
          <Card className="glass-card">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)]">Return on Investment</span>
            <h3 className={`text-xl font-bold mt-1.5 ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfit ? "+" : ""}{trade.roi.toFixed(2)}%
            </h3>
            <p className="text-[11px] text-[var(--muted)] mt-1">Weight ROI percent</p>
          </Card>
        </div>

        {/* Section 1: Stock Portfolio Asset Tracking */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-400" /> Stock holdings
              </CardTitle>
              <CardDescription>Allocated assets in this specific trade portfolio</CardDescription>
            </div>
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal("addStock")}
                className="flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Stock
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol / Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Avg Buy Price</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Holding Cost</TableHead>
                  <TableHead>Market value</TableHead>
                  <TableHead>Profit/Loss</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  {isActive && <TableHead className="w-20 text-center">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {trade.stocks.map((stock) => {
                  const hasProfit = stock.profit >= 0;
                  return (
                    <TableRow key={stock.id}>
                      <TableCell className="font-semibold text-white">{stock.name}</TableCell>
                      <TableCell>{stock.quantity}</TableCell>
                      <TableCell>${stock.buyPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-100">${stock.currentPrice.toLocaleString()}</TableCell>
                      <TableCell>${stock.cost.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-100">${stock.value.toLocaleString()}</TableCell>
                      <TableCell className={hasProfit ? "text-emerald-400" : "text-rose-400"}>
                        {hasProfit ? "+" : "-"}${Math.abs(stock.profit).toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${hasProfit ? "text-emerald-400" : "text-rose-400"}`}>
                        {hasProfit ? "+" : ""}{stock.roi.toFixed(1)}%
                      </TableCell>
                      {isActive && (
                        <TableCell className="flex justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStock(stock);
                              setStockQty(stock.quantity.toString());
                              setStockBuy(stock.buyPrice.toString());
                              setStockCurrent(stock.currentPrice.toString());
                              setActiveModal("editStock");
                            }}
                            className="p-1 text-slate-400 hover:text-white hover:bg-[#1a2336] rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteStock(stock.id)}
                            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}

                {trade.stocks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isActive ? 9 : 8} className="text-center py-8 text-[var(--muted)]">
                      No stock holdings allocated to this trade. Cash balance is liquid (${trade.totalInvestment.toLocaleString()}).
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Section 2: Proportional Multi-Investor System */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users size={18} className="text-blue-400" /> Proportional Investor shares
              </CardTitle>
              <CardDescription>Autosplit engine dividing returns proportionally to net investments.</CardDescription>
            </div>
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal("addInvestor")}
                className="flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Investor
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor Name</TableHead>
                  <TableHead>Total Deposits</TableHead>
                  <TableHead>Total Withdrawals</TableHead>
                  <TableHead>Net Invested Capital</TableHead>
                  <TableHead>Ownership Share %</TableHead>
                  <TableHead>Proportional profit</TableHead>
                  <TableHead>Holdings Value</TableHead>
                  {isActive && <TableHead className="w-28 text-center">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {trade.investors.map((investor) => {
                  const hasProfit = investor.profitShare >= 0;
                  return (
                    <TableRow key={investor.id}>
                      <TableCell className="font-semibold text-white">{investor.name}</TableCell>
                      <TableCell>${investor.totalDeposits.toLocaleString()}</TableCell>
                      <TableCell>${investor.totalWithdrawals.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-100">${investor.netInvestment.toLocaleString()}</TableCell>
                      <TableCell className="text-blue-400 font-semibold">{investor.sharePercentage.toFixed(2)}%</TableCell>
                      <TableCell className={hasProfit ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                        {hasProfit ? "+" : "-"}${Math.abs(investor.profitShare).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-100 font-semibold">${investor.currentValue.toLocaleString()}</TableCell>
                      {isActive && (
                        <TableCell className="flex justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInvestor(investor);
                              setTxType("DEPOSIT");
                              setActiveModal("recordTx");
                            }}
                            className="flex items-center gap-0.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-xs font-medium cursor-pointer"
                          >
                            <DollarSign size={10} /> Capital
                          </button>
                          
                          {/* Disable delete for main owner */}
                          {investor.name !== "Owner (You)" && (
                            <button
                              onClick={() => handleDeleteInvestor(investor.id)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* MODALS */}
        {/* Modal: Add Stock */}
        <Modal
          isOpen={activeModal === "addStock"}
          onClose={() => setActiveModal("none")}
          title="Add Stock Holding"
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveModal("none")} type="button">Cancel</Button>
              <Button variant="primary" type="submit" form="add-stock-form" isLoading={isActionLoading}>Add Stock</Button>
            </div>
          }
        >
          <form id="add-stock-form" onSubmit={handleAddStockSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Stock Name / Symbol</label>
              <input
                type="text"
                placeholder="e.g. Nvidia Corp (NVDA)"
                required
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Quantity</label>
                <input
                  type="number"
                  step="any"
                  placeholder="20"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Buy Price ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="150"
                  required
                  value={stockBuy}
                  onChange={(e) => setStockBuy(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Current Price ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="175"
                  required
                  value={stockCurrent}
                  onChange={(e) => setStockCurrent(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit Stock */}
        <Modal
          isOpen={activeModal === "editStock"}
          onClose={() => setActiveModal("none")}
          title={`Edit ${selectedStock?.name}`}
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveModal("none")} type="button">Cancel</Button>
              <Button variant="primary" type="submit" form="edit-stock-form" isLoading={isActionLoading}>Update Values</Button>
            </div>
          }
        >
          <form id="edit-stock-form" onSubmit={handleEditStockSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Quantity</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Buy Price ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={stockBuy}
                  onChange={(e) => setStockBuy(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Current Price ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={stockCurrent}
                  onChange={(e) => setStockCurrent(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* Modal: Add Investor */}
        <Modal
          isOpen={activeModal === "addInvestor"}
          onClose={() => setActiveModal("none")}
          title="Add Investor to Trade Book"
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveModal("none")} type="button">Cancel</Button>
              <Button variant="primary" type="submit" form="add-investor-form" isLoading={isActionLoading}>Add Investor</Button>
            </div>
          }
        >
          <form id="add-investor-form" onSubmit={handleAddInvestorSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Investor Name</label>
              <input
                type="text"
                placeholder="e.g. Usha, Mom, Partner Name"
                required
                value={investorName}
                onChange={(e) => setInvestorName(e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Initial Capital Deposit ($)</label>
              <input
                type="number"
                placeholder="2000"
                required
                value={investorDeposit}
                onChange={(e) => setInvestorDeposit(e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </form>
        </Modal>

        {/* Modal: Record Transaction (Deposit/Withdrawal) */}
        <Modal
          isOpen={activeModal === "recordTx"}
          onClose={() => setActiveModal("none")}
          title={`Capital Adjustment: ${selectedInvestor?.name}`}
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveModal("none")} type="button">Cancel</Button>
              <Button variant="primary" type="submit" form="record-tx-form" isLoading={isActionLoading}>Record Transaction</Button>
            </div>
          }
        >
          <form id="record-tx-form" onSubmit={handleRecordTxSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Transaction Type</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="DEPOSIT">DEPOSIT CAPITAL</option>
                  <option value="WITHDRAWAL">WITHDRAW CAPITAL</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Cash Amount ($)</label>
                <input
                  type="number"
                  placeholder="1000"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Description / Memo</label>
              <input
                type="text"
                placeholder="e.g. Added capital for MSFT buyout"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </form>
        </Modal>

        {/* Modal: Close Trade & Rollover */}
        <Modal
          isOpen={activeModal === "closeTrade"}
          onClose={() => setActiveModal("none")}
          title="Close Trade Book & Proportional Rollover"
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveModal("none")} type="button">Cancel</Button>
              <Button variant="danger" type="submit" form="close-trade-form" isLoading={isActionLoading}>Confirm Close & Rollover</Button>
            </div>
          }
        >
          <form id="close-trade-form" onSubmit={handleCloseTradeSubmit} className="space-y-4">
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 text-yellow-400 text-xs leading-relaxed space-y-2">
              <p className="font-semibold">⚠️ CRITICAL ACTION REQUIREMENT</p>
              <p>Closing this trade will lock in the current stock profit of <strong>${trade.totalProfit.toLocaleString()}</strong>. The trade status will set to CLOSED permanently.</p>
              <p>Profit shares will automatically distribute proportionally to: {trade.investors.map((i) => `${i.name} (${i.sharePercentage.toFixed(0)}%)`).join(", ")}.</p>
            </div>

            {trade.totalProfit > 0 && activeTradesList.length > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Select active target trade book for proportional profit rollover:</label>
                <select
                  value={targetTradeId}
                  onChange={(e) => setTargetTradeId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {activeTradesList.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--muted)]">We will automatically construct ROLLOVER transactions and add the rolled capital to each investor&apos;s allocation in the target trade book.</p>
              </div>
            ) : trade.totalProfit > 0 ? (
              <div className="text-xs text-[var(--muted)] border-t border-[var(--card-border)] pt-4">
                No other active trades available. Profits will be closed but not rolled. Establish another trade book first if you wish to rollover.
              </div>
            ) : (
              <div className="text-xs text-[var(--muted)] border-t border-[var(--card-border)] pt-4">
                This trade book does not have profit to roll over.
              </div>
            )}
          </form>
        </Modal>
      </main>
    </div>
  );
}
