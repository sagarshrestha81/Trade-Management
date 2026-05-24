"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar ($)" },
  { code: "INR", symbol: "₹", name: "Indian Rupee (₹)" },
  { code: "EUR", symbol: "€", name: "Euro (€)" },
  { code: "GBP", symbol: "£", name: "British Pound (£)" },
  { code: "NPR", symbol: "₨", name: "Nepalese Rupee (₨)" },
];

interface CurrencyContextType {
  currentCurrency: Currency;
  setCurrencyByCode: (code: string) => void;
  formatVal: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(CURRENCIES[0]);

  useEffect(() => {
    const savedCode = localStorage.getItem("currency_code");
    if (savedCode) {
      const found = CURRENCIES.find((c) => c.code === savedCode);
      if (found) setCurrentCurrency(found);
    }
  }, []);

  const setCurrencyByCode = (code: string) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) {
      setCurrentCurrency(found);
      localStorage.setItem("currency_code", code);
      // Dispatch storage event to alert other components if necessary
      window.dispatchEvent(new Event("storage"));
    }
  };

  const formatVal = (value: number) => {
    return `${currentCurrency.symbol}${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currentCurrency, setCurrencyByCode, formatVal }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
