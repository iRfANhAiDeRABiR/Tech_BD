"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { itemCount, isHydrated } = useCart();

  const visibleCount =
    itemCount > 99 ? "99+" : String(itemCount);

  return (
    <Link
      href="/cart"
      className="header-cart-link"
      aria-label={
        isHydrated
          ? `Shopping cart with ${itemCount} ${
              itemCount === 1 ? "item" : "items"
            }`
          : "Shopping cart"
      }
    >
      <span className="header-cart-icon" aria-hidden="true">
        🛒
      </span>

      <span className="header-cart-label">Cart</span>

      {isHydrated && itemCount > 0 && (
        <span className="header-cart-count">
          {visibleCount}
        </span>
      )}
    </Link>
  );
}
