import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useCurrency } from "@/context/CurrencyContext";

interface GrowthData {
  date: string;
  investment: number;
  value: number;
}

interface PortfolioGrowthChartProps {
  data: GrowthData[];
}

export default function PortfolioGrowthChart({ data }: PortfolioGrowthChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { currentCurrency } = useCurrency();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-xs text-[var(--muted)]">
        Loading chart...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-xs text-[var(--muted)]">
        No growth data recorded yet
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2942" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${currentCurrency.symbol}${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#121829",
              borderColor: "#1e2942",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: any) => [`${currentCurrency.symbol}${Number(value).toLocaleString()}`, "Amount"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            name="Portfolio Value"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
          <Area
            type="monotone"
            dataKey="investment"
            name="Invested Cash"
            stroke="#64748b"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorInvestment)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
