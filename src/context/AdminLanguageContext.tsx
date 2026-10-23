"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  type AdminLanguage,
  type AdminTranslations,
  adminTranslations,
  formatAdminNumber,
  formatAdminCurrency,
  formatAdminDateShort,
  getAdminStatusLabel,
} from "@/lib/admin-translations";

const STORAGE_KEY = "tsbd_admin_lang";
const EVENT_KEY = "tsbd_admin_lang_change";

interface AdminLanguageContextType {
  lang: AdminLanguage;
  setLang: (lang: AdminLanguage) => void;
  t: AdminTranslations;
  formatNumber: (num: number | string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  statusLabel: (status: string) => string;
}

const AdminLanguageContext = createContext<AdminLanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: adminTranslations.en,
  formatNumber: (n) => String(n),
  formatCurrency: (n) => `৳${n}`,
  formatDate: (d) => String(d),
  statusLabel: (s) => s,
});

export function AdminLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AdminLanguage>("en");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "bn") {
        setLangState(saved);
      }
    } catch {
      // Storage unavailable fallback
    }

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<AdminLanguage>;
      if (customEvent.detail === "en" || customEvent.detail === "bn") {
        setLangState(customEvent.detail);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "en" || e.newValue === "bn")) {
        setLangState(e.newValue);
      }
    };

    window.addEventListener(EVENT_KEY, handleCustomChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener(EVENT_KEY, handleCustomChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setLang = useCallback((nextLang: AdminLanguage) => {
    setLangState(nextLang);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLang);
      window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: nextLang }));
    } catch {
      // Ignore
    }
  }, []);

  const activeLang = isMounted ? lang : "en";
  const t = useMemo(() => adminTranslations[activeLang], [activeLang]);

  const formatNumber = useCallback(
    (num: number | string) => formatAdminNumber(num, activeLang),
    [activeLang]
  );

  const formatCurrency = useCallback(
    (amount: number) => formatAdminCurrency(amount, activeLang),
    [activeLang]
  );

  const formatDate = useCallback(
    (date: Date | string) => formatAdminDateShort(date, activeLang),
    [activeLang]
  );

  const statusLabel = useCallback(
    (status: string) => getAdminStatusLabel(status, activeLang),
    [activeLang]
  );

  const value = useMemo(
    () => ({
      lang: activeLang,
      setLang,
      t,
      formatNumber,
      formatCurrency,
      formatDate,
      statusLabel,
    }),
    [activeLang, setLang, t, formatNumber, formatCurrency, formatDate, statusLabel]
  );

  return (
    <AdminLanguageContext.Provider value={value}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage(): AdminLanguageContextType {
  const context = useContext(AdminLanguageContext);
  return context;
}
