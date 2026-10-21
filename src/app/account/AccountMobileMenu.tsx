"use client";

import { useState, useEffect, useRef } from "react";
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
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./AccountMobileMenu.module.css";

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

interface AccountMobileMenuProps {
  displayName: string;
}

export default function AccountMobileMenu({ displayName }: AccountMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const currentItem = NAV_ITEMS.find((item) => item.href === pathname);
  const CurrentIcon = currentItem?.icon || Menu;

  return (
    <div className={styles.mobileMenuContainer} ref={menuRef}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="account-mobile-nav"
        aria-label="Account menu"
      >
        <CurrentIcon size={18} />
        <span>{currentItem?.label || "Account"}</span>
        {isOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <nav
            id="account-mobile-nav"
            className={styles.drawer}
            aria-label="Account navigation"
          >
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Account Menu</span>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.userCard}>
              <div className={styles.userAvatar}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className={styles.userName}>{displayName}</span>
            </div>

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
                        onClick={() => setIsOpen(false)}
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
        </>
      )}
    </div>
  );
}