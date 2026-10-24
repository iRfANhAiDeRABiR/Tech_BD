"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  DownloadCloud,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  Activity,
  TicketPercent,
  LifeBuoy,
  Image as ImageIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AdminLanguageDropdown } from "@/components/admin/AdminLanguageDropdown";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import type { AdminTranslations } from "@/lib/admin-translations";
import styles from "@/app/admin/admin.module.css";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userEmail?: string | null;
  logoutAction: () => Promise<void>;
}

function getBreadcrumb(
  pathname: string,
  t: AdminTranslations
): { title: string; subtitle?: string } {
  if (pathname === "/admin") {
    return { title: t.bc_overview, subtitle: t.bc_dashboard };
  }
  if (pathname.startsWith("/admin/orders/")) {
    return { title: t.bc_order_details, subtitle: t.nav_orders };
  }
  if (pathname.startsWith("/admin/orders")) {
    return { title: t.bc_orders_management, subtitle: t.nav_orders };
  }
  if (pathname.startsWith("/admin/products/new")) {
    return { title: t.bc_create_product, subtitle: t.nav_products };
  }
  if (pathname.includes("/edit") && pathname.includes("/products")) {
    return { title: t.bc_edit_product, subtitle: t.nav_products };
  }
  if (pathname.startsWith("/admin/products")) {
    return { title: t.bc_products_catalog, subtitle: t.nav_products };
  }
  if (pathname.startsWith("/admin/images")) {
    return { title: "Media & Image Library", subtitle: "Catalog Assets" };
  }
  if (pathname.startsWith("/admin/categories")) {
    return { title: t.bc_categories, subtitle: t.nav_group_management };
  }
  if (pathname.startsWith("/admin/downloads")) {
    return { title: t.bc_downloads, subtitle: t.nav_downloads };
  }
  if (pathname.startsWith("/admin/coupons")) {
    return { title: t.bc_coupons, subtitle: t.nav_group_management };
  }
  if (pathname.startsWith("/admin/tickets")) {
    return { title: "Support Tickets", subtitle: "Customer Service" };
  }
  if (pathname.startsWith("/admin/bans")) {
    return { title: t.bc_bans, subtitle: t.nav_group_system };
  }
  if (pathname.startsWith("/admin/logs")) {
    return { title: t.bc_logs, subtitle: t.nav_group_system };
  }
  if (pathname.startsWith("/admin/system")) {
    return { title: t.bc_system_health, subtitle: t.nav_group_system };
  }
  return { title: t.bc_admin_console, subtitle: "Tech BD" };
}

export function AdminLayoutClient({
  children,
  userEmail,
  logoutAction,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useAdminLanguage();

  const breadcrumb = useMemo(() => getBreadcrumb(pathname, t), [pathname, t]);

  const navItems = useMemo(
    () => [
      {
        label: t.nav_dashboard,
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        label: t.nav_orders,
        href: "/admin/orders",
        icon: ShoppingBag,
        exact: false,
      },
      {
        label: t.nav_products,
        href: "/admin/products",
        icon: Package,
        exact: false,
      },
      {
        label: "Image Library",
        href: "/admin/images",
        icon: ImageIcon,
        exact: false,
      },
      {
        label: t.nav_categories,
        href: "/admin/categories",
        icon: Layers,
        exact: false,
      },
      {
        label: t.nav_downloads,
        href: "/admin/downloads",
        icon: DownloadCloud,
        exact: false,
      },
      {
        label: t.nav_coupons,
        href: "/admin/coupons",
        icon: TicketPercent,
        exact: false,
      },
      {
        label: "Support Tickets",
        href: "/admin/tickets",
        icon: LifeBuoy,
        exact: false,
      },
      {
        label: t.nav_bans,
        href: "/admin/bans",
        icon: ShieldAlert,
        exact: false,
      },
      {
        label: t.nav_logs,
        href: "/admin/logs",
        icon: ClipboardList,
        exact: false,
      },
    ],
    [t]
  );

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isItemActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={styles.adminShell}>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.adminSidebar} ${
          mobileOpen ? styles.adminSidebarOpen : ""
        }`}
      >
        {/* Brand Area */}
        <div className={styles.sidebarBrand}>
          <Link href="/admin" className={styles.sidebarBrandLink}>
            <div className={styles.brandIconBox}>
              <ShieldCheck size={20} className={styles.brandIcon} />
            </div>
            <div className={styles.brandTextBox}>
              <span className={styles.brandTitle}>Tech BD</span>
              <span className={styles.brandBadge}>Admin Panel</span>
            </div>
          </Link>
          <button
            type="button"
            className={styles.mobileCloseBtn}
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className={styles.sidebarNavWrap}>
          <div className={styles.navGroup}>
            <span className={styles.navGroupLabel}>{t.nav_group_management}</span>
            <nav className={styles.navLinks}>
              {navItems.map((item) => {
                const active = isItemActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${
                      active ? styles.navLinkActive : ""
                    }`}
                  >
                    <Icon size={17} className={styles.navLinkIcon} />
                    <span className={styles.navLinkLabel}>{item.label}</span>
                    {active && <div className={styles.navActivePip} />}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.navGroupLabel}>{t.nav_group_system}</span>
            <nav className={styles.navLinks}>
              <Link
                href="/admin/system"
                className={`${styles.navLink} ${
                  isItemActive("/admin/system", false) ? styles.navLinkActive : ""
                }`}
              >
                <Activity size={17} className={styles.navLinkIcon} />
                <span className={styles.navLinkLabel}>{t.nav_system_health}</span>
                {isItemActive("/admin/system", false) && <div className={styles.navActivePip} />}
              </Link>
            </nav>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.navGroupLabel}>{t.nav_group_storefront}</span>
            <nav className={styles.navLinks}>
              <Link
                href="/home"
                target="_blank"
                rel="noreferrer"
                className={styles.navLink}
              >
                <ExternalLink size={17} className={styles.navLinkIcon} />
                <span className={styles.navLinkLabel}>{t.nav_live_store}</span>
                <span className={styles.navLinkExternalTag}>↗</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <Link
            href="/admin/system"
            className={styles.systemStatusBadge}
            style={{ textDecoration: "none", cursor: "pointer" }}
            title="Click to view full System Health & Diagnostics"
          >
            <span className={styles.systemStatusDot} />
            <span className={styles.systemStatusText}>{t.system_online}</span>
          </Link>

          <div className={styles.userProfileRow}>
            <div className={styles.userAvatar}>
              {(userEmail ? userEmail[0] : "A").toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{t.administrator}</span>
              <span className={styles.userEmail} title={userEmail || "Admin"}>
                {userEmail || "admin@techbd.com"}
              </span>
            </div>
            <form action={logoutAction} className={styles.logoutForm}>
              <button
                type="submit"
                className={styles.sidebarLogoutBtn}
                title={t.top_sign_out_title}
                aria-label={t.top_sign_out}
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.adminMainArea}>
        {/* Top Header Bar */}
        <header className={styles.adminTopBar}>
          <div className={styles.topBarLeft}>
            <button
              type="button"
              className={styles.hamburgerBtn}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            <div className={styles.topBarBreadcrumb}>
              <span className={styles.breadcrumbSub}>{breadcrumb.subtitle}</span>
              <ChevronRight size={14} className={styles.breadcrumbChevron} />
              <h1 className={styles.breadcrumbTitle}>{breadcrumb.title}</h1>
            </div>
          </div>

          <div className={styles.topBarRight}>
            {/* English/Bangla Language Dropdown Button */}
            <AdminLanguageDropdown />

            <Link
              href="/admin/products/new"
              className={styles.topBarQuickAddBtn}
              title={t.dash_add_product}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className={styles.quickAddText}>{t.top_add_product}</span>
            </Link>

            <div className={styles.topBarDivider} />

            <ThemeToggle />

            <form action={logoutAction} className={styles.topBarLogoutForm}>
              <button
                type="submit"
                className={styles.topBarLogoutBtn}
                title={t.top_sign_out_title}
              >
                <LogOut size={15} />
                <span className={styles.topBarLogoutText}>{t.top_sign_out}</span>
              </button>
            </form>
          </div>
        </header>

        {/* Main Page Content */}
        <main className={styles.adminMainContent}>{children}</main>
      </div>
    </div>
  );
}
