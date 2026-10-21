import Link from "next/link";
import { Home, ShoppingBag, Link2Off } from "lucide-react";
import { BackButton } from "./not-found-actions";
import styles from "./not-found.module.css";

const POPULAR_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products#products-by-category", label: "Products" },
  { href: "/tools", label: "Tools" },
];

export default function NotFound() {
  return (
    <main className={styles.page}>
      {/* Decorative background (theme-aware, non-interactive) */}
      <span className={`${styles.glow} ${styles.glowPurple}`} aria-hidden="true" />
      <span className={`${styles.glow} ${styles.glowTeal}`} aria-hidden="true" />
      <span className={`${styles.dot} ${styles.dotPurple}`} aria-hidden="true" />
      <span className={`${styles.dot} ${styles.dotTeal}`} aria-hidden="true" />
      <span className={`${styles.dot} ${styles.ring}`} aria-hidden="true" />

      <div className={styles.content}>
        <span className={styles.badge}>
          <Link2Off size={14} aria-hidden="true" />
          Error 404
        </span>

        <p className={styles.code} aria-hidden="true">
          404
        </p>

        <h1 className={styles.title}>Page Not Found</h1>

        <p className={styles.message}>
          Oops! This page seems to be lost. The page you're looking for
          doesn't exist, may have been moved, or the URL is incorrect.
          Let's get you back somewhere useful.
        </p>

        <div className={styles.actions}>
          <Link href="/" className="btn btn--primary btn--lg">
            <Home size={18} aria-hidden="true" />
            Go to Homepage
          </Link>

          <Link
            href="/products#products-by-category"
            className="btn btn--lg"
            style={{
              border: "1px solid var(--border-glow)",
              color: "var(--text-primary)",
              background: "var(--bg-glass)",
            }}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            Browse Products
          </Link>
        </div>

        <BackButton />

        <nav className={styles.links} aria-label="Popular destinations">
          <span className={styles.linksLabel}>Popular destinations</span>
          {POPULAR_LINKS.map((link, index) => (
            <span key={link.href} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              {index > 0 && (
                <span className={styles.separator} aria-hidden="true">
                  •
                </span>
              )}
              <Link href={link.href} className={styles.link}>
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </main>
  );
}