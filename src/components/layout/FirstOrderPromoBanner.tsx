"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Copy, Check, X, ArrowRight, Zap } from "lucide-react";
import { notify } from "@/lib/toast";
import styles from "./FirstOrderPromoBanner.module.css";

const COUPON_CODE = "TECHBD10";
const STORAGE_DISMISSED_KEY = "techbd_promo_banner_dismissed";

export function FirstOrderPromoBanner() {
  const [isDismissed, setIsDismissed] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_DISMISSED_KEY);
      if (!dismissed) {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      notify.success("Coupon code copied!", {
        description: `Use ${COUPON_CODE} at checkout for 10% discount.`,
        id: "promo-copied",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleApply = () => {
    try {
      sessionStorage.setItem("techbd_pending_coupon", COUPON_CODE);
      notify.success("10% Discount Activated!", {
        description: `Code ${COUPON_CODE} will automatically apply to your cart.`,
        id: "promo-applied",
      });
    } catch {
      // ignore
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  };

  if (isDismissed) return null;

  return (
    <div className={styles.promoBanner} role="region" aria-label="First order promotion">
      <div className={styles.inner}>
        <div className={styles.contentGroup}>
          <Sparkles size={16} className={styles.sparkleIcon} />
          <div className={styles.promoText}>
            <span>First Order Special: Get</span>
            <span className={styles.promoHighlight}>10% OFF</span>
            <span>on all genuine software with code</span>
            <span className={styles.couponPill}>{COUPON_CODE}</span>
          </div>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            onClick={handleCopy}
            className={styles.copyBtn}
            title={`Copy ${COUPON_CODE}`}
          >
            {copied ? <Check size={12} style={{ color: "#34d399" }} /> : <Copy size={12} />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>

          <Link
            href="/products#products-by-category"
            onClick={handleApply}
            className={styles.applyBtn}
            title="Apply 10% discount to cart"
          >
            <Zap size={12} />
            <span>Apply 10% OFF</span>
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            className={styles.closeBtn}
            aria-label="Dismiss promotion banner"
            title="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

