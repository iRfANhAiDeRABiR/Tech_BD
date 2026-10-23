"use client";

import Link from "next/link";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import { ProductImportExport } from "@/components/admin/ProductImportExport";
import styles from "@/app/admin/admin.module.css";

export function AdminProductsHeader({
  savedNotice,
  deletedNotice,
}: {
  savedNotice?: boolean;
  deletedNotice?: boolean;
}) {
  const { lang } = useAdminLanguage();

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>{lang === "bn" ? "প্রোডাক্ট সমূহ" : "Products"}</h1>
          <p className={styles.muted}>
            {lang === "bn"
              ? "রিয়েল-টাইমে আপনার স্টোরের সকল প্রোডাক্ট পরিচালনা, ফিল্টার ও এডিট করুন।"
              : "Manage, find, track, and edit your catalog items in real-time."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <ProductImportExport />
          <Link className={styles.button} href="/admin/products/new">
            {lang === "bn" ? "+ নতুন প্রোডাক্ট যোগ করুন" : "+ Add product"}
          </Link>
        </div>
      </div>

      {savedNotice && (
        <p className={styles.notice}>
          {lang === "bn"
            ? "✓ প্রোডাক্ট সফলভাবে সংরক্ষিত এবং আপডেট করা হয়েছে।"
            : "✓ Product saved and updated successfully."}
        </p>
      )}
      {deletedNotice && (
        <p className={styles.notice}>
          {lang === "bn"
            ? "✓ প্রোডাক্ট ক্যাটালগ সফলভাবে আপডেট করা হয়েছে।"
            : "✓ Product catalog updated successfully."}
        </p>
      )}
    </>
  );
}

