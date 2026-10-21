import styles from "@/app/admin/admin.module.css";

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

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase();
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  const className = statusClassMap[normalized] || styles.statusDraft;

  return (
    <span className={`${styles.statusBadgeModern} ${className}`}>
      <span className={styles.statusDot} />
      {formatStatusLabel(status)}
    </span>
  );
}