import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import styles from "@/app/admin/admin.module.css";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "blue" | "green" | "purple" | "cyan" | "orange" | "pink";
  href?: string;
  trend?: string;
  subtext?: string;
  badge?: {
    text: string;
    variant?: "warning" | "success" | "neutral";
  };
};

const accentClassMap = {
  blue: styles.iconBlue,
  green: styles.iconGreen,
  purple: styles.iconPurple,
  cyan: styles.iconCyan,
  orange: styles.iconOrange,
  pink: styles.iconPink,
};

export function StatCard({
  title,
  value,
  icon: Icon,
  accent = "blue",
  href,
  trend,
  subtext,
  badge,
}: StatCardProps) {
  const content = (
    <div className={styles.statCard}>
      <div className={styles.statCardHeader}>
        <span className={styles.statCardLabel}>{title}</span>
        <div
          className={`${styles.statCardIcon} ${
            accentClassMap[accent] || accentClassMap.blue
          }`}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>

      <div className={styles.statCardBody}>
        <div className={styles.statCardValue}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {badge && (
          <span
            className={`${styles.statCardBadge} ${
              badge.variant === "warning"
                ? styles.badgeWarning
                : badge.variant === "success"
                ? styles.badgeSuccess
                : styles.badgeNeutral
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className={styles.statCardFooter}>
          {subtext && <span className={styles.statCardSubtext}>{subtext}</span>}
          {trend && <span className={styles.statCardTrend}>{trend}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={styles.statCardLink}>
        {content}
      </Link>
    );
  }

  return content;
}
