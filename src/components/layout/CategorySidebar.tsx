"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { StoreCategory } from "@/types/product";
import styles from "./CategorySidebar.module.css";

const defaultCategories: StoreCategory[] = [
  {
    slug: "windows",
    name: "Windows License",
    description: "Windows licenses",
    count: 0,
    image: "/img_content/win11pro.png",
    accent: "#0078D4",
  },
  {
    slug: "office",
    name: "Microsoft Office",
    description: "Microsoft Office",
    count: 0,
    image: "/img_content/office24proplus.png",
    accent: "#D83B01",
  },
];

interface CategorySidebarProps {
  categories?: StoreCategory[];
}

interface SidebarCategoryItem {
  label: string;
  href: string;
  image?: string | null;
  alt?: string;
  letter?: string;
  emoji?: string;
  className?: string;
}

const mobileNavLinks = [
  { label: "Home", href: "/home", emoji: "🏠" },
  { label: "Software Download", href: "/downloads", emoji: "📥" },
  { label: "Tools", href: "/tools", emoji: "🛠️" },
  { label: "About Us", href: "/home#features", emoji: "✨" },
  { label: "Contact", href: "/home#contact", emoji: "📞" },
];

export function CategorySidebar({
  categories = defaultCategories,
}: CategorySidebarProps) {
  const sidebarCategories: SidebarCategoryItem[] = [
    {
      label: "All Products",
      href: "/products#products-by-category",
      emoji: "🛒",
    },
    ...categories.map((category) => ({
      label: category.name,
      href: `/home?category=${category.slug}#products`,
      image: category.image,
      alt: category.name,
      letter: category.image ? undefined : category.name.charAt(0),
    })),
  ];

  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const openSidebar = () => setIsOpen(true);

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!sidebarRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("techbd:open-category-sidebar", openSidebar);
    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      window.removeEventListener("techbd:open-category-sidebar", openSidebar);
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth <= 900) {
      document.body.style.overflow = "hidden";
    } else if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
        aria-label="Product category navigation"
      >
        <div className={styles.header}>
          <Link
            href="/home#categories"
            className={styles.headerTitleLink}
            onClick={() => setIsOpen(false)}
          >
            <span className={styles.menuIcon} aria-hidden="true">
              ☰
            </span>
            <span className={styles.title}>All Categories</span>
          </Link>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Mobile Navigation Links (Only shown on mobile drawer) */}
        <div className={styles.mobileNavSection}>
          <div className={styles.sectionHeading}>Navigation</div>
          <ul className={styles.list}>
            {mobileNavLinks.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={styles.item}
                  onClick={() => setIsOpen(false)}
                >
                  <span className={styles.icon} aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className={styles.label}>{item.label}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.sectionHeading}>Categories</div>
        </div>

        <ul className={styles.list}>
          {sidebarCategories.map((category) => (
            <li key={category.label}>
              <Link
                href={category.href}
                className={styles.item}
                onClick={() => setIsOpen(false)}
              >
                <span
                  className={`${styles.icon} ${category.className ?? ""} ${
                    category.letter ? styles.letterIcon : ""
                  }`}
                  aria-hidden="true"
                >
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt=""
                      width={30}
                      height={30}
                    />
                  ) : (
                    category.letter ?? category.emoji
                  )}
                </span>

                <span className={styles.label}>{category.label}</span>
                <span className={styles.arrow} aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
