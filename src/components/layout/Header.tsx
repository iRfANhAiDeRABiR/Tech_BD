"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CartLink } from "@/components/cart/CartLink";
import { AuthButton } from "./AuthButton";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHash, setActiveHash] = useState("");

  const getNavLinkClassName = (targetPath: string, targetHash = "") => {
    const isSamePath = pathname === targetPath;
    const isProductPath =
      targetPath === "/products" && pathname.startsWith("/products");
    const isHomeRoot =
      targetPath === "/home" && !targetHash && isSamePath && !activeHash;
    const isExactPage = targetPath !== "/home" && !targetHash && isSamePath;
    const isHashActive =
      Boolean(targetHash) && isSamePath && activeHash === targetHash;
    const isActive = isProductPath || isHomeRoot || isExactPage || isHashActive;

    return `nav-main-link${isActive ? " active" : ""}`;
  };

  const openCategorySidebar = () => {
    window.dispatchEvent(new Event("techbd:open-category-sidebar"));
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();
    const isProductsPage = pathname.startsWith("/products");
    const targetUrl = query
      ? `${isProductsPage ? "/products" : "/home"}?search=${encodeURIComponent(
          query,
        )}#${isProductsPage ? "products-by-category" : "products"}`
      : "/products#products-by-category";

    router.push(targetUrl);
  };

  const clearHeaderSearch = () => {
    setSearchQuery("");

    const url = new URL(window.location.href);

    if (!url.searchParams.has("search")) {
      return;
    }

    url.searchParams.delete("search");
    router.push(
      `${url.pathname}${url.search}#${
        pathname.startsWith("/products") ? "products-by-category" : "products"
      }`,
    );
  };

  useEffect(() => {
    let animationFrameId: number | null = null;

    const updateScrollState = () => {
      const scrollY = window.scrollY;

      setIsScrolled((current) => {
        if (!current && scrollY > 96) return true;
        if (current && scrollY < 8) return false;
        return current;
      });
    };

    const requestScrollUpdate = () => {
      if (animationFrameId !== null) return;

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateScrollState();
      });
    };

    updateScrollState();
    window.addEventListener("scroll", requestScrollUpdate, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", requestScrollUpdate);
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    const updateActiveHash = () => {
      setActiveHash(window.location.hash.replace("#", ""));
    };

    window.addEventListener("hashchange", updateActiveHash);
    window.addEventListener("popstate", updateActiveHash);

    return () => {
      window.removeEventListener("hashchange", updateActiveHash);
      window.removeEventListener("popstate", updateActiveHash);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setActiveHash(window.location.hash.replace("#", ""));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <header className={`site-header${isScrolled ? " scrolled" : ""}`}>
      <div className="promo-bar">
        <div className="container promo-bar__inner">
          <div className="promo-bar__left">
            <a
              href="mailto:info@techsolutions.bd"
              className="promo-bar__link"
            >
              ✉ info@techsolutions.bd
            </a>

            <span className="promo-bar__sep" />

            <a href="tel:+8809697399879" className="promo-bar__link">
              ☎ +880 9697399879
            </a>
          </div>

          <div className="promo-bar__ticker-wrap" aria-live="off" aria-label="Announcements">
            <div className="promo-bar__ticker-track">
              {/* — original set — */}
              <span className="promo-bar__ticker-item">⚡ বিশেষ অফার! সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান</span>
              <span className="promo-bar__ticker-dot" aria-hidden="true">•</span>
              <span className="promo-bar__ticker-item promo-bar__ticker-item--amber">✓ Trusted by 50,000+ customers</span>
              <span className="promo-bar__ticker-dot" aria-hidden="true">•</span>
              <span className="promo-bar__ticker-item promo-bar__ticker-item--green">🔒 100% Secure Payment</span>
              <span className="promo-bar__ticker-dot" aria-hidden="true">•</span>
              {/* — duplicate for seamless loop — */}
              <span className="promo-bar__ticker-item">⚡ বিশেষ অফার! সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান</span>
              <span className="promo-bar__ticker-dot" aria-hidden="true">•</span>
              <span className="promo-bar__ticker-item promo-bar__ticker-item--amber">✓ Trusted by 50,000+ customers</span>
              <span className="promo-bar__ticker-dot" aria-hidden="true">•</span>
              <span className="promo-bar__ticker-item promo-bar__ticker-item--green">🔒 100% Secure Payment</span>
              <span className="promo-bar__ticker-dot" aria-hidden="true">•</span>
            </div>
          </div>

          <div className="promo-bar__right">
            <a
              href="https://www.facebook.com/share/1F869SJntn/"
              target="_blank"
              rel="noopener noreferrer"
              className="promo-bar__social promo-bar__social--facebook"
              aria-label="Tech Solutions BD Facebook page"
              title="Facebook page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>

            <a
              href="https://wa.me/message/7ZV3N6YFBF5ED1"
              target="_blank"
              rel="noopener noreferrer"
              className="promo-bar__social promo-bar__social--whatsapp"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            </a>

            <a
              href="https://t.me/techsolutionsbd247"
              target="_blank"
              rel="noopener noreferrer"
              className="promo-bar__social promo-bar__social--telegram"
              aria-label="Tech Solutions BD Telegram support"
              title="Telegram support"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="header-top container">
        <Link href="/home" className="header-logo">
          <div className="logo-icon">
            <Image
              src="/img_content/tsb.png"
              alt="Tech Solutions BD"
              width={56}
              height={56}
              loading="eager"
              style={{ objectFit: "contain" }}
            />
          </div>

          <div className="logo-text">
            <span className="logo-name">
              Tech Solutions{" "}
              <span className="logo-tag">BD</span>
            </span>
          </div>
        </Link>

        <form
          className="modern-search-box"
          role="search"
          aria-label="Search products"
          onSubmit={handleSearchSubmit}
        >
          <input
            type="search"
            className="modern-search-input"
            placeholder="Search for genuine software licenses..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

          <svg
            className="search-icon-inside"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          {searchQuery && (
            <button
              type="button"
              className="modern-search-clear-btn"
              aria-label="Clear search filter"
              onClick={clearHeaderSearch}
            >
              ×
            </button>
          )}

          <button
            type="submit"
            className="modern-search-btn"
            aria-label="Search products"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        <div className="header-right-group">
          <div className="header-support">
            <div className="header-support__icon">☎</div>

            <div className="header-support-info">
              <span className="support-label">24/7 Support</span>
              <a href="tel:+8809697399879" className="support-number">
                +880 9697399879
              </a>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </div>

      <div className="header-bottom">
        <div className="container header-bottom__inner">
          <div className="header-bottom__left">
            <button
              type="button"
              className="category-pill"
              onClick={openCategorySidebar}
              aria-label="Open all categories menu"
            >
              ☰ All Categories
            </button>

            <nav className="nav-main-links" aria-label="Primary navigation">
              <Link href="/home" className={getNavLinkClassName("/home")}>
                Home
              </Link>

              <Link
                href="/products"
                className={getNavLinkClassName("/products")}
              >
                Products
              </Link>

              <Link
                href="/downloads"
                className={getNavLinkClassName("/downloads")}
              >
                Software Download
              </Link>

              <Link
                href="/tools"
                className={getNavLinkClassName("/tools")}
              >
                Tools
              </Link>

              <Link
                href="/home#features"
                className={getNavLinkClassName("/home", "features")}
              >
                About Us
              </Link>

              <Link
                href="/home#contact"
                className={getNavLinkClassName("/home", "contact")}
              >
                Contact
              </Link>
            </nav>
          </div>

          <div className="header-actions">
            <AuthButton />
            <CartLink />

            <Link
              href="/products#products-by-category"
              className="btn btn--primary header-shop-link"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
