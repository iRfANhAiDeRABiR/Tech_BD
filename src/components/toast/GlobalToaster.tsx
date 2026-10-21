"use client";

import { useSyncExternalStore } from "react";
import { toastStore, notify, type ToastItemData } from "@/lib/toast";
import { ToastItem } from "./ToastItem";
import styles from "./toast.module.css";

const emptyToasts: ToastItemData[] = [];

export function GlobalToaster() {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getToasts,
    () => emptyToasts
  );

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.container}
      aria-label="Notifications"
      role="region"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={notify.dismiss}
        />
      ))}
    </div>
  );
}

