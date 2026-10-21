"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Lock,
  KeyRound,
  Download,
  RefreshCw,
  Heart,
  Bell,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./AccountSidebar.module.css";

const NAV_ITEMS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/security", label: "Security", icon: Lock },
  { href: "/account/licenses", label: "My Licenses", icon: KeyRound },
  { href: "/account/downloads", label: "Downloads", icon: Download },
  { href: "/account/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className={styles.sidebar} aria-label="Account navigation">
      <div className={styles.section}>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.section}>
        <button
          onClick={handleSignOut}
          className={styles.navItem}
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit" }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
