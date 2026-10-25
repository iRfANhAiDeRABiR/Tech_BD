"use client";

import { useEffect } from "react";
import { notify } from "@/lib/toast";

const PROTECTED_SELECTOR = "[data-policy-copy-protected='true']";

export default function PolicyCopyProtection() {
  useEffect(() => {
    let lastToastTime = 0;

    const blockCopyAction = (event: Event) => {
      const target = event.target;

      if (target instanceof Element && target.closest(PROTECTED_SELECTOR)) {
        event.preventDefault();

        if (event.type === "copy" || event.type === "cut") {
          const now = Date.now();
          if (now - lastToastTime > 1500) {
            lastToastTime = now;
            notify.warning("Content Protected", {
              id: "content-protected-notice",
              description: "Content from Tech Solutions BD is copyright protected.",
              duration: 3500,
            });
          }
        }
      }
    };

    document.addEventListener("copy", blockCopyAction, true);
    document.addEventListener("cut", blockCopyAction, true);
    document.addEventListener("dragstart", blockCopyAction, true);
    document.addEventListener("selectstart", blockCopyAction, true);
    document.addEventListener("contextmenu", blockCopyAction, true);

    return () => {
      document.removeEventListener("copy", blockCopyAction, true);
      document.removeEventListener("cut", blockCopyAction, true);
      document.removeEventListener("dragstart", blockCopyAction, true);
      document.removeEventListener("selectstart", blockCopyAction, true);
      document.removeEventListener("contextmenu", blockCopyAction, true);
    };
  }, []);

  return null;
}
