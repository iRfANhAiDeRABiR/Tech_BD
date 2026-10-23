import React from "react";
import Link from "next/link";
import { ShieldAlert, MessageCircle, Send, AlertTriangle, ArrowLeft } from "lucide-react";
import styles from "./banned.module.css";

export const dynamic = "force-dynamic";

export default async function BannedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; id?: string }>;
}) {
  const query = await searchParams;
  const reason = query.reason || "Policy violation / নিরাপত্তা নীতিমালা লঙ্ঘন";
  const banId = query.id || "REF-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <ShieldAlert size={42} className={styles.icon} />
          </div>

          <span className={styles.badge}>
            <AlertTriangle size={14} />
            <span>অ্যাক্সেস স্থগিত / Access Denied</span>
          </span>

          <h1 className={styles.title}>আপনার অ্যাক্সেস সীমাবদ্ধ করা হয়েছে</h1>

          <p className={styles.subtitle}>
            সাইটের নিরাপত্তা ও নীতিমালা সুরক্ষার স্বার্থে এই আইপি অ্যাড্রেস বা অ্যাকাউন্ট থেকে সাময়িকভাবে বা স্থায়ীভাবে অ্যাক্সেস স্থগিত করা হয়েছে।
          </p>

          <div className={styles.detailsBox}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>স্থগিতকরণের কারণ (Reason):</span>
              <strong className={styles.detailValue}>{reason}</strong>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>রেফারেন্স আইডি (Ban Ref):</span>
              <code className={styles.detailCode}>{banId}</code>
            </div>
          </div>

          <div className={styles.supportSection}>
            <p className={styles.supportText}>
              যদি এটি কোনো ভুলবশত ঘটে থাকে অথবা আপনি আপনার অ্যাকাউন্ট আনব্যান করতে চান, তবে অনুগ্রহ করে আমাদের ২৪/৭ সাপোর্ট টিমের সাথে সরাসরি যোগাযোগ করুন:
            </p>

            <div className={styles.actions}>
              <a
                href={`https://wa.me/message/7ZV3N6YFBF5ED1?text=${encodeURIComponent(
                  `Hello TechBD Support, my access was restricted. Reference ID: ${banId}. Reason: ${reason}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                <MessageCircle size={18} />
                <span>হোয়াটসঅ্যাপে সাপোর্ট চ্যাট</span>
              </a>

              <a
                href="https://t.me/techsolutionsbd247"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.telegramBtn}
              >
                <Send size={18} />
                <span>টেলিগ্রাম সাপোর্ট</span>
              </a>
            </div>
          </div>

          <div className={styles.footerRow}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={15} />
              <span>হোমপেজে ফিরে যান (যদি আনব্যান হয়ে থাকেন)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

