"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import type { Session, User } from "@supabase/supabase-js";

const CUSTOMER_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const CUSTOMER_WARN_BEFORE_MS = 10 * 60 * 1000; // 10 minutes warning before logout
const COOKIE_TOUCH_INTERVAL_MS = 60 * 1000; // Touch cookie at most once a minute

function setLastActiveCookie(timestamp: number) {
  if (typeof document === "undefined") return;
  document.cookie = `techbd_user_last_active=${timestamp}; path=/; max-age=${
    7 * 24 * 60 * 60
  }; SameSite=Lax`;
}

function clearLastActiveCookie() {
  if (typeof document === "undefined") return;
  document.cookie =
    "techbd_user_last_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

export function CustomerSessionTimeout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const lastActiveRef = useRef<number>(Date.now());
  const lastCookieTouchRef = useRef<number>(0);
  const hasWarnedRef = useRef<boolean>(false);
  const isUserLoggedInRef = useRef<boolean>(false);

  // 1. Detect if redirected with ?session=timeout from proxy
  useEffect(() => {
    if (searchParams?.get("session") === "timeout") {
      notify.info("সেশনের মেয়াদ শেষ", {
        description: "দীর্ঘ সময় নিষ্ক্রিয়তার কারণে আপনার অ্যাকাউন্ট লগআউট হয়েছে। পুনরায় সাইন-ইন করুন।",
        id: "customer-session-proxy-timeout",
        duration: 7000,
      });

      // Clean the query param cleanly
      const url = new URL(window.location.href);
      url.searchParams.delete("session");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // 2. Monitor Auth State and Idle Activity
  useEffect(() => {
    // Initial check
    supabase.auth.getUser().then((res: { data: { user: User | null } }) => {
      const user = res.data?.user ?? null;
      isUserLoggedInRef.current = Boolean(user);
      if (user) {
        lastActiveRef.current = Date.now();
        setLastActiveCookie(Date.now());
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      const user = session?.user ?? null;
      isUserLoggedInRef.current = Boolean(user);
      if (user) {
        lastActiveRef.current = Date.now();
        setLastActiveCookie(Date.now());
      } else {
        clearLastActiveCookie();
      }
    });

    const handleActivity = () => {
      if (!isUserLoggedInRef.current) return;
      const now = Date.now();
      lastActiveRef.current = now;
      hasWarnedRef.current = false;

      // Throttle cookie updates
      if (now - lastCookieTouchRef.current > COOKIE_TOUCH_INTERVAL_MS) {
        lastCookieTouchRef.current = now;
        setLastActiveCookie(now);
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );

    const interval = setInterval(async () => {
      if (!isUserLoggedInRef.current) return;

      const idleTime = Date.now() - lastActiveRef.current;

      // Warning when 10 minutes left
      if (
        idleTime >= CUSTOMER_IDLE_TIMEOUT_MS - CUSTOMER_WARN_BEFORE_MS &&
        !hasWarnedRef.current &&
        idleTime < CUSTOMER_IDLE_TIMEOUT_MS
      ) {
        hasWarnedRef.current = true;
        notify.warning("সেশনের সময় শেষ হতে চলেছে", {
          description: "নিষ্ক্রিয়তার কারণে আগামী ১০ মিনিটের মধ্যে আপনার অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে লগআউট হবে।",
          id: "customer-session-warning",
          duration: 9000,
        });
      }

      // Idle Timeout Reached
      if (idleTime >= CUSTOMER_IDLE_TIMEOUT_MS) {
        clearInterval(interval);
        clearLastActiveCookie();

        if (typeof window !== "undefined") {
          sessionStorage.removeItem("techbd_verified_download_order");
          window.dispatchEvent(new CustomEvent("techbd:auth-logout"));
        }

        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }

        notify.info("সেশন টাইম-আউট", {
          description: "২ ঘণ্টা নিষ্ক্রিয়তার কারণে আপনার অ্যাকাউন্ট লগআউট হয়েছে।",
          id: "customer-session-timeout",
          duration: 7000,
        });

        router.refresh();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
      events.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
    };
  }, [supabase, router]);

  return null;
}

