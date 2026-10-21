"use client";

import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import type { CartItemInput } from "@/types/cart";

interface BuyNowButtonProps {
  productId: string;
  productName?: string;
  variant?: "detail" | "card";
  disabled?: boolean;
  cartItem?: CartItemInput;
}

export function BuyNowButton({
  productId,
  productName = "product",
  variant = "detail",
  disabled = false,
  cartItem,
}: BuyNowButtonProps) {
  const router = useRouter();
  const { addItem, getQuantity, isHydrated } = useCart();
  const itemToAdd = cartItem ?? { productId };

  function buyNow() {
    if (disabled) return;

    if (getQuantity(productId, itemToAdd.optionId) === 0) {
      addItem(itemToAdd);
    }

    router.push("/cart");
  }

  return (
    <button
      type="button"
      className={
        variant === "card"
          ? "product-action-button product-action-button--buy"
          : "btn btn--buy-now btn--lg"
      }
      disabled={!isHydrated || disabled}
      onClick={buyNow}
      aria-label={disabled ? `${productName} is out of stock` : `Buy ${productName} now`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />
      </svg>
      <span>{disabled ? "Out of Stock" : "Buy Now"}</span>
    </button>
  );
}
