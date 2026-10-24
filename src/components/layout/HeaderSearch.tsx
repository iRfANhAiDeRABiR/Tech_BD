"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./HeaderSearch.module.css";

interface SearchResultItem {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  price: number;
  originalPrice: number | null;
  image: string;
  badge: string;
}

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const { formatPrice } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync searchQuery from URL on initial load / navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const searchParam = url.searchParams.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [pathname]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch search results when user types (debounced 160ms)
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 160);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchSubmit = (event?: FormEvent) => {
    if (event) event.preventDefault();

    if (selectedIndex >= 0 && results[selectedIndex]) {
      const selected = results[selectedIndex];
      setIsOpen(false);
      router.push(`/products/${selected.id}`);
      return;
    }

    const query = searchQuery.trim();
    setIsOpen(false);
    const isProductsPage = pathname.startsWith("/products");
    const targetUrl = query
      ? `${isProductsPage ? "/products" : "/home"}?search=${encodeURIComponent(
          query,
        )}#${isProductsPage ? "products-by-category" : "products"}`
      : "/products#products-by-category";

    router.push(targetUrl);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter") {
        handleSearchSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("search")) {
        url.searchParams.delete("search");
        router.push(`${url.pathname}${url.search}`);
      }
    }
    inputRef.current?.focus();
  };

  const onSelectProduct = (productId: string) => {
    setIsOpen(false);
    router.push(`/products/${productId}`);
  };

  return (
    <div className={styles.searchWrapper} ref={wrapperRef}>
      <form
        className="modern-search-box"
        role="search"
        aria-label="Search products"
        onSubmit={handleSearchSubmit}
        style={{ margin: 0, width: "100%", maxWidth: "100%" }}
      >
        <input
          ref={inputRef}
          type="search"
          className="modern-search-input"
          placeholder="Search for genuine software licenses..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onFocus={() => {
            if (searchQuery.trim().length > 0 && results.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
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
            onClick={clearSearch}
          >
            ×
          </button>
        )}

        <button
          type="submit"
          className="modern-search-btn"
          aria-label="Search products"
        >
          {isLoading ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ animation: "spin 0.8s linear infinite" }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="32"
                strokeDashoffset="12"
              />
            </svg>
          ) : (
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          )}
        </button>
      </form>

      {isOpen && (
        <div className={styles.dropdown}>
          {results.length > 0 ? (
            <>
              <div className={styles.dropdownHeader}>
                <span>Suggested Products</span>
                <span>{results.length} found</span>
              </div>

              <ul className={styles.resultsList} role="listbox">
                {results.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.resultItem} ${
                        isSelected ? styles.resultItemActive : ""
                      }`}
                      onClick={() => onSelectProduct(item.id)}
                    >
                      <div className={styles.thumbWrapper}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={44}
                          height={44}
                          className={styles.thumbImg}
                        />
                      </div>

                      <div className={styles.itemInfo}>
                        <div className={styles.itemTitle}>{item.name}</div>
                        <div className={styles.itemMeta}>
                          <span className={styles.categoryTag}>
                            {item.categoryName || item.category}
                          </span>
                          {item.badge && (
                            <span className={styles.itemBadge}>{item.badge}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.itemPrice}>
                        <div className={styles.currentPrice} suppressHydrationWarning>
                          {formatPrice(item.price)}
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className={styles.originalPrice} suppressHydrationWarning>
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.dropdownFooter}>
                <span>Press <strong>Enter</strong> to view all results</span>
                <Link
                  href={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                  className={styles.viewAllLink}
                  onClick={() => setIsOpen(false)}
                >
                  View All &rarr;
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              No products found for &ldquo;<strong>{searchQuery}</strong>&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

