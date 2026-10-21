"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import styles from "./not-found.module.css";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.backButton}
      onClick={() => router.back()}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Go Back
    </button>
  );
}
