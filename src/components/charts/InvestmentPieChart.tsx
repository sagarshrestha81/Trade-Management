import React, { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useCurrency } from "@/context/CurrencyContext";

interface PieData {
  name: string;
  value: number;
}

interface InvestmentPieChartProps {
  data: PieData[];
}

const COLORS = [
  "#2563eb", // Royal Blue
  "#10b981", // Emerald Green
  "#a855f7", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
];

export default function InvestmentPieChart({ data }: InvestmentPieChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { currentCurrency } = useCurrency();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-[250px] w-full items-center justify-center text-xs text-[var(--muted)]">
        Loading chart...
      </div>
    );
  }

  const validData = data.filter((d) => d.value > 0);

  if (validData.length === 0) {
    return (
      <div className="flex h-[250px] w-full items-center justify-center text-xs text-[var(--muted)]">
        No investment capital allocated yet
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={validData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {validData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#121829" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#121829",
              borderColor: "#1e2942",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: any) => [`${currentCurrency.symbol}${Number(value).toLocaleString()}`, "Capital"]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
