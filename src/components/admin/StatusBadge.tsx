"use client";

import styles from "@/app/admin/admin.module.css";
import { useAdminLanguage } from "@/context/AdminLanguageContext";

type StatusBadgeProps = {
  status: string;
};

const statusClassMap: Record<string, string> = {
  PAID: styles.statusPaid,
  COMPLETED: styles.statusCompleted,
  VERIFIED: styles.statusVerified,
  HEALTHY: styles.statusHealthy,
  ONLINE: styles.statusHealthy,
  PENDING: styles.statusPending,
  PENDING_PAYMENT: styles.statusPending,
  SUBMITTED: styles.statusSubmitted,
  PAYMENT_SUBMITTED: styles.statusSubmitted,
  PROCESSING: styles.statusProcessing,
  FAILED: styles.statusFailed,
  REJECTED: styles.statusRejected,
  CANCELLED: styles.statusCancelled,
  OFFLINE: styles.statusOffline,
  ERROR: styles.statusError,
  REFUNDED: styles.statusRefunded,
  DRAFT: styles.statusDraft,
  ARCHIVED: styles.statusArchived,
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { statusLabel } = useAdminLanguage();
  const normalized = status.toUpperCase();
  const className = statusClassMap[normalized] || styles.statusDraft;

  const label = statusLabel ? statusLabel(status) : status.replace(/_/g, " ").toLowerCase();

  return (
    <span className={`${styles.statusBadgeModern} ${className}`}>
      <span className={styles.statusDot} />
      {label}
    </span>
  );
}
