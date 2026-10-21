"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ToastItemData } from "@/lib/toast";
import styles from "./toast.module.css";

/* ── SVG Status Icons ─────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

interface ToastItemProps {
  toast: ToastItemData;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(1); // 1 = 100%, 0 = 0%
  const isHoveredRef = useRef(false);
  const remainingTimeRef = useRef(toast.duration);
  const lastTickRef = useRef<number>(Date.now());
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startDismissAnimation = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 180);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    remainingTimeRef.current = toast.duration;
    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      if (!isHoveredRef.current) {
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - delta);
        setProgress(remainingTimeRef.current / toast.duration);

        if (remainingTimeRef.current <= 0) {
          clearInterval(interval);
          startDismissAnimation();
        }
      }
    }, 50);

    return () => {
      clearInterval(interval);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [toast.id, toast.duration, startDismissAnimation]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    lastTickRef.current = Date.now();
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    lastTickRef.current = Date.now();
  };

  const typeClass =
    toast.type === "success"
      ? styles.toastSuccess
      : toast.type === "error"
      ? styles.toastError
      : toast.type === "warning"
      ? styles.toastWarning
      : styles.toastInfo;

  return (
    <div
      className={`${styles.toast} ${typeClass} ${isLeaving ? styles.toastLeaving : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <div className={styles.leftAccent} aria-hidden="true" />

      <div className={styles.contentWrap}>
        <div className={styles.iconWrap} aria-hidden="true">
          {toast.type === "success" && <CheckIcon />}
          {toast.type === "error" && <ErrorIcon />}
          {toast.type === "warning" && <WarningIcon />}
          {toast.type === "info" && <InfoIcon />}
        </div>

        <div className={styles.textBody}>
          <h4 className={styles.title}>{toast.title}</h4>
          {toast.description && (
            <p className={styles.description}>{toast.description}</p>
          )}

          {toast.action && (
            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => {
                  toast.action?.onClick();
                  startDismissAnimation();
                }}
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {toast.dismissible && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={startDismissAnimation}
            aria-label="Dismiss notification"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div className={styles.progressBarContainer} aria-hidden="true">
        <div
          className={styles.progressBar}
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </div>
  );
}

