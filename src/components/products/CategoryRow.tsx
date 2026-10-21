"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { ProductSummary } from "@/types/product";
import styles from "./CategoryRow.module.css";

interface CategoryRowProps {
  products: ProductSummary[];
  forceTwoRows?: boolean;
}

export function CategoryRow({
  products,
  forceTwoRows = false,
}: CategoryRowProps) {
  const [page, setPage] = useState(0);

  const isTwoRow = forceTwoRows ? products.length > 5 : products.length >= 10;
  const pageSize = isTwoRow ? 10 : 5;
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [products]);

  const activePage = Math.min(page, totalPages - 1);
  const start = activePage * pageSize;
  const visible = products.slice(start, start + pageSize);

  const canPrev = activePage > 0;
  const canNext = activePage < totalPages - 1;

  // Fill empty slots so cards don't stretch when fewer than row target
  const targetSlots = isTwoRow && visible.length > 5 ? 10 : 5;
  const emptySlotsCount =
    visible.length > 0 ? Math.max(0, targetSlots - visible.length) : 0;

  return (
    <div
      className={`${styles.wrapper} ${isTwoRow ? styles.twoRowWrapper : ""}`}
    >
      <button
        type="button"
        className={`${styles.navBtn} ${styles.navBtnPrev}`}
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        disabled={!canPrev}
        aria-label="Previous products"
      >
        <svg
          className={styles.navIcon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14.5 6L8.5 12L14.5 18"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className={`${styles.row} ${isTwoRow ? styles.twoRowGrid : ""}`}>
        {visible.map((product) => (
          <div className={styles.tile} key={product.id}>
            <ProductCard product={product} showBuyNow />
          </div>
        ))}
        {emptySlotsCount > 0 &&
          Array.from({ length: emptySlotsCount }).map((_, i) => (
            <div className={styles.tileSpacer} key={`spacer-${i}`} />
          ))}
      </div>

      <button
        type="button"
        className={`${styles.navBtn} ${styles.navBtnNext}`}
        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        disabled={!canNext}
        aria-label="Next products"
      >
        <svg
          className={styles.navIcon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9.5 6L15.5 12L9.5 18"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
