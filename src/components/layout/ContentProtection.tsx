"use client";

import { useEffect } from "react";
import { notify } from "@/lib/toast";

/**
 * Global content protection listener for storefront pages.
 * Intercepts copy and cut actions on website content, prevents the copy action,
 * and displays a "Content Protected" toast notification instead of injecting
 * clipboard watermarks. Form inputs, textareas, admin dashboard, and tools remain accessible.
 */
export function ContentProtection() {
  useEffect(() => {
    let lastToastTime = 0;

    const handleCopy = (event: ClipboardEvent) => {
      // 0. Skip protection in admin routes or interactive utility tools
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/admin") || path.startsWith("/tools")) {
          return;
        }
      }

      // 1. Allow normal copy inside inputs, textareas, and contentEditable fields
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable ||
        Boolean(target?.closest?.("input, textarea, [contenteditable='true']"))
      ) {
        return;
      }

      // 2. Allow explicitly permitted copy elements (e.g. coupon codes, order references)
      if (target?.closest?.("[data-allow-copy='true'], .allow-copy")) {
        return;
      }

      // 3. Check if text is selected
      const selection = window.getSelection();
      const selectedText = selection?.toString()?.trim();
      if (!selectedText) {
        return;
      }

      // Also ensure the selection is not entirely inside an input or textarea
      const anchorNode = selection?.anchorNode;
      const anchorEl = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
      if (
        anchorEl?.closest?.("input, textarea, [contenteditable='true'], [data-allow-copy='true'], .allow-copy")
      ) {
        return;
      }

      // 4. Prevent copying content text (leaves clipboard untouched without watermarks)
      event.preventDefault();

      // 5. Display the Content Protected toast notification (throttled to avoid spam)
      const now = Date.now();
      if (now - lastToastTime > 1500) {
        lastToastTime = now;
        notify.warning("Content Protected", {
          id: "content-protected-notice",
          description: "Content from Tech Solutions BD is copyright protected.",
          duration: 3500,
        });
      }
    };

    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCopy, true);

    return () => {
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCopy, true);
    };
  }, []);

  return null;
}
