"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useCurrency, type Currency } from "@/context/CurrencyContext";
import styles from "./CurrencySelector.module.css";

interface CurrencySelectorProps {
  compact?: boolean;
}

export function CurrencySelector({ compact = false }: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const selectCurrency = (c: Currency) => {
    setCurrency(c);
    setIsOpen(false);
  };

  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ""}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Currency: ${currency}. Click to switch.`}
        title="Switch Currency (BDT / USD)"
      >
        <span className={styles.symbol}>{currency === "BDT" ? "৳" : "$"}</span>
        <span className={styles.code}>{currency}</span>
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <button
            type="button"
            className={`${styles.option} ${currency === "BDT" ? styles.optionActive : ""}`}
            onClick={() => selectCurrency("BDT")}
            role="option"
            aria-selected={currency === "BDT"}
          >
            <div className={styles.optionLeft}>
              <span className={styles.optionFlag}>🇧🇩</span>
              <div className={styles.optionInfo}>
                <span className={styles.optionName}>BDT (৳)</span>
                <span className={styles.optionSub}>Bangladeshi Taka</span>
              </div>
            </div>
            {currency === "BDT" && <Check size={14} className={styles.checkIcon} />}
          </button>

          <button
            type="button"
            className={`${styles.option} ${currency === "USD" ? styles.optionActive : ""}`}
            onClick={() => selectCurrency("USD")}
            role="option"
            aria-selected={currency === "USD"}
          >
            <div className={styles.optionLeft}>
              <span className={styles.optionFlag}>🇺🇸</span>
              <div className={styles.optionInfo}>
                <span className={styles.optionName}>USD ($)</span>
                <span className={styles.optionSub}>US Dollar</span>
              </div>
            </div>
            {currency === "USD" && <Check size={14} className={styles.checkIcon} />}
          </button>
        </div>
      )}
    </div>
  );
}
