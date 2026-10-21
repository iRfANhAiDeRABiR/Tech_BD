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
  {
    slug: "365",
    name: "Office 365",
    description: "Office 365",
    count: 0,
    image: "/img_content/O365log.png",
    accent: "#7B5EA7",
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

export function CategorySidebar({
  categories = defaultCategories,
}: CategorySidebarProps) {
  const sidebarCategories: SidebarCategoryItem[] = [
    {
      label: "All Products",
      href: "/products#products-by-category",
      emoji: "🛒",
    },
    {
      label: "Software Download",
      href: "/downloads",
      emoji: "📥",
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

  return (
    <aside
      ref={sidebarRef}
      className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
      aria-label="Product category navigation"
    >
      <Link
        href="/home#categories"
        className={styles.header}
        onClick={() => setIsOpen(false)}
      >
        <span className={styles.menuIcon} aria-hidden="true">
          ☰
        </span>
        <span className={styles.title}>All Categories</span>
      </Link>

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
  );
}