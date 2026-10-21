"use client";

import { useEffect } from "react";

const PROTECTED_SELECTOR = "[data-policy-copy-protected='true']";

export default function PolicyCopyProtection() {
  useEffect(() => {
    const blockCopyAction = (event: Event) => {
      const target = event.target;

      if (target instanceof Element && target.closest(PROTECTED_SELECTOR)) {
        event.preventDefault();
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