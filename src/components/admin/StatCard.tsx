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
};

const accentClassMap = {
  blue: styles.iconBlue,
  green: styles.iconGreen,
  purple: styles.iconPurple,
  cyan: styles.iconCyan,
  orange: styles.iconOrange,
  pink: styles.iconPink,
};

export function StatCard({ title, value, icon: Icon, accent = "blue", href, trend }: StatCardProps) {
  const content = (
    <div className={styles.statCard}>
      <div className={styles.statCardHeader}>
        <span className={styles.statCardLabel}>{title}</span>
        <div className={`${styles.statCardIcon} ${accentClassMap[accent] || accentClassMap.blue}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      <div className={styles.statCardValue}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {trend && <div className={styles.statCardTrend}>{trend}</div>}
    </div>
  );

  if (href) {
    return <Link href={href} className={styles.cardLink}>{content}</Link>;
  }

  return content;
}