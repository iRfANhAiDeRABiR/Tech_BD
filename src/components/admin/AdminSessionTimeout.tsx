"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/toast";

const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ADMIN_WARN_BEFORE_MS = 5 * 60 * 1000; // 5 minutes warning before logout (at 25 min)

interface AdminSessionTimeoutProps {
  logoutAction: () => Promise<void>;
}

export function AdminSessionTimeout({ logoutAction }: AdminSessionTimeoutProps) {
  const router = useRouter();
  const lastActiveRef = useRef<number>(Date.now());
  const hasWarnedRef = useRef<boolean>(false);

  useEffect(() => {
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
      hasWarnedRef.current = false;
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );

    const interval = setInterval(async () => {
      const idleTime = Date.now() - lastActiveRef.current;

      // 1. Warning when 5 minutes left
      if (
        idleTime >= ADMIN_IDLE_TIMEOUT_MS - ADMIN_WARN_BEFORE_MS &&
        !hasWarnedRef.current &&
        idleTime < ADMIN_IDLE_TIMEOUT_MS
      ) {
        hasWarnedRef.current = true;
        notify.warning("সেশনের সময় শেষ হতে চলেছে", {
          description: "নিষ্ক্রিয়তার কারণে আগামী ৫ মিনিটের মধ্যে অ্যাডমিন সেশন শেষ হয়ে যাবে। চালিয়ে যেতে পেজে ক্লিক করুন।",
          id: "admin-session-warning",
          duration: 10000,
        });
      }

      // 2. Timeout reached
      if (idleTime >= ADMIN_IDLE_TIMEOUT_MS) {
        clearInterval(interval);
        notify.error("অ্যাডমিন সেশনের মেয়াদ শেষ", {
          description: "৩০ মিনিট নিষ্ক্রিয়তার কারণে আপনার সেশনের মেয়াদ শেষ হয়েছে। পুনরায় লগইন করুন।",
          id: "admin-session-timeout",
          duration: 6000,
        });

        try {
          await logoutAction();
        } catch {
          router.push("/admin/login?error=timeout");
        }
      }
    }, 15000); // Check every 15 seconds

    return () => {
      clearInterval(interval);
      events.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
    };
  }, [logoutAction, router]);

  return null;
}

