import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Receipt, BarChart3, LogOut, TrendingUp, User, Globe } from "lucide-react";
import { useCurrency, CURRENCIES } from "@/context/CurrencyContext";

interface UserProfile {
  name: string;
  email: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const { currentCurrency, setCurrencyByCode } = useCurrency();

  useEffect(() => {
    // Read user from localStorage or dynamic fallback
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser({ name: "John Doe", email: "test@test.com" });
      }
    } else {
      setUser({ name: "John Doe", email: "test@test.com" });
    }
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        localStorage.removeItem("user");
        router.push("/auth/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Trades & Rollovers", href: "/dashboard/trades", icon: BarChart3 },
    { name: "Audit Log & History", href: "/dashboard/audit-log", icon: Receipt },
  ];

  return (
    <aside className="w-64 border-r border-[var(--card-border)] bg-[#0c1222] text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Brand Header */}
      <div className="flex items-center gap-2 px-6 py-6 border-b border-[var(--card-border)] bg-[#090e1a]/80">
        <div className="rounded-lg bg-blue-600 p-1.5 text-white">
          <TrendingUp size={20} />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">Trade</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all-custom cursor-pointer ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "hover:bg-[#151c2f] hover:text-white border border-transparent"
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Currency Selector & User profile */}
      <div className="p-4 border-t border-[var(--card-border)] bg-[#090e1a]/40 space-y-4">
        <div className="space-y-2 px-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--muted)]">
            <Globe size={11} /> Display Currency
          </div>
          <select
            value={currentCurrency.code}
            onChange={(e) => setCurrencyByCode(e.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[#090e1a] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <div className="flex items-center gap-3 px-2 py-1 pt-2 border-t border-[var(--card-border)]/40">
            <div className="h-9 w-9 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-semibold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-[var(--muted)] truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          Logout Session
        </button>
      </div>
    </aside>
  );
}
