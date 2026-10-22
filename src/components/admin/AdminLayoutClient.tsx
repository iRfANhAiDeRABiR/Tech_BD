"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  Activity,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import styles from "@/app/admin/admin.module.css";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userEmail?: string | null;
  logoutAction: () => Promise<void>;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
    exact: false,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
    exact: false,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Layers,
    exact: false,
  },
  {
    label: "Downloads",
    href: "/admin/downloads",
    icon: DownloadCloud,
    exact: false,
  },
];

function getBreadcrumb(pathname: string): { title: string; subtitle?: string } {
  if (pathname === "/admin") {
    return { title: "Overview", subtitle: "Dashboard" };
  }
  if (pathname.startsWith("/admin/orders/")) {
    return { title: "Order Details", subtitle: "Orders" };
  }
  if (pathname.startsWith("/admin/orders")) {
    return { title: "Orders Management", subtitle: "Orders" };
  }
  if (pathname.startsWith("/admin/products/new")) {
    return { title: "Create New Product", subtitle: "Products" };
  }
  if (pathname.includes("/edit") && pathname.includes("/products")) {
    return { title: "Edit Product", subtitle: "Products" };
  }
  if (pathname.startsWith("/admin/products")) {
    return { title: "Product Catalog", subtitle: "Products" };
  }
  if (pathname.startsWith("/admin/categories")) {
    return { title: "Categories", subtitle: "Catalog" };
  }
  if (pathname.startsWith("/admin/downloads")) {
    return { title: "Software Downloads", subtitle: "Downloads" };
  }
  if (pathname.startsWith("/admin/system")) {
    return { title: "System Health & Diagnostics", subtitle: "System" };
  }
  return { title: "Admin Console", subtitle: "Tech BD" };
}

export function AdminLayoutClient({
  children,
  userEmail,
  logoutAction,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const breadcrumb = getBreadcrumb(pathname);

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
            <span className={styles.navGroupLabel}>Management</span>
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
            <span className={styles.navGroupLabel}>System</span>
            <nav className={styles.navLinks}>
              <Link
                href="/admin/system"
                className={`${styles.navLink} ${
                  isItemActive("/admin/system", false) ? styles.navLinkActive : ""
                }`}
              >
                <Activity size={17} className={styles.navLinkIcon} />
                <span className={styles.navLinkLabel}>System Health</span>
                {isItemActive("/admin/system", false) && <div className={styles.navActivePip} />}
              </Link>
            </nav>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.navGroupLabel}>Storefront</span>
            <nav className={styles.navLinks}>
              <Link
                href="/home"
                target="_blank"
                rel="noreferrer"
                className={styles.navLink}
              >
                <ExternalLink size={17} className={styles.navLinkIcon} />
                <span className={styles.navLinkLabel}>Live Store</span>
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
            <span className={styles.systemStatusText}>System Online</span>
          </Link>

          <div className={styles.userProfileRow}>
            <div className={styles.userAvatar}>
              {(userEmail ? userEmail[0] : "A").toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Administrator</span>
              <span className={styles.userEmail} title={userEmail || "Admin"}>
                {userEmail || "admin@techbd.com"}
              </span>
            </div>
            <form action={logoutAction} className={styles.logoutForm}>
              <button
                type="submit"
                className={styles.sidebarLogoutBtn}
                title="Sign out of Admin"
                aria-label="Sign out"
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
            <Link
              href="/admin/products/new"
              className={styles.topBarQuickAddBtn}
              title="Add a new product"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className={styles.quickAddText}>Add Product</span>
            </Link>

            <div className={styles.topBarDivider} />

            <ThemeToggle />

            <form action={logoutAction} className={styles.topBarLogoutForm}>
              <button
                type="submit"
                className={styles.topBarLogoutBtn}
                title="Sign out"
              >
                <LogOut size={15} />
                <span className={styles.topBarLogoutText}>Sign out</span>
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

