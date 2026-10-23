"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

export type Currency = "BDT" | "USD";

export const BDT_TO_USD_RATE = 125;
const STORAGE_KEY = "techbd_currency";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (bdtAmount: number) => string;
  convertPrice: (bdtAmount: number) => {
    amount: number;
    symbol: string;
    currency: Currency;
    formatted: string;
  };
  rate: number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "BDT",
  setCurrency: () => {},
  formatPrice: (amount: number) =>
    `৳${Math.max(0, Math.round(amount)).toLocaleString("en-BD")}`,
  convertPrice: (amount: number) => ({
    amount: Math.max(0, Math.round(amount)),
    symbol: "৳",
    currency: "BDT",
    formatted: `৳${Math.max(0, Math.round(amount)).toLocaleString("en-BD")}`,
  }),
  rate: BDT_TO_USD_RATE,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("BDT");

  // Read saved currency on client mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Currency | null;
      if (saved === "BDT" || saved === "USD") {
        setCurrencyState(saved);
      }
    } catch {
      // Storage unavailable fallback
    }
  }, []);

  const setCurrency = useCallback((nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextCurrency);
      window.dispatchEvent(
        new CustomEvent("techbd:currency-change", { detail: nextCurrency })
      );
    } catch {
      // Storage unavailable fallback
    }
  }, []);

  const formatPrice = useCallback(
    (bdtAmount: number): string => {
      const validBdt = Math.max(0, bdtAmount || 0);
      if (currency === "USD") {
        const usdCeil = validBdt === 0 ? 0 : Math.ceil(validBdt / BDT_TO_USD_RATE);
        return `$${usdCeil.toLocaleString("en-US")}`;
      }
      return `৳${Math.round(validBdt).toLocaleString("en-BD")}`;
    },
    [currency]
  );

  const convertPrice = useCallback(
    (bdtAmount: number) => {
      const validBdt = Math.max(0, bdtAmount || 0);
      if (currency === "USD") {
        const usdCeil = validBdt === 0 ? 0 : Math.ceil(validBdt / BDT_TO_USD_RATE);
        return {
          amount: usdCeil,
          symbol: "$",
          currency: "USD" as Currency,
          formatted: `$${usdCeil.toLocaleString("en-US")}`,
        };
      }
      const rounded = Math.round(validBdt);
      return {
        amount: rounded,
        symbol: "৳",
        currency: "BDT" as Currency,
        formatted: `৳${rounded.toLocaleString("en-BD")}`,
      };
    },
    [currency]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatPrice,
      convertPrice,
      rate: BDT_TO_USD_RATE,
    }),
    [currency, setCurrency, formatPrice, convertPrice]
  );

  return (
    <CurrencyContext.Provider value={value}>
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

