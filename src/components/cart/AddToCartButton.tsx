"use client";

import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { notify } from "@/lib/toast";
import type { CartItemInput } from "@/types/cart";

interface AddToCartButtonProps {
  productId: string;
  productName?: string;
  variant?: "detail" | "card";
  disabled?: boolean;
  cartItem?: CartItemInput;
}

export function AddToCartButton({
  productId,
  productName = "product",
  variant = "detail",
  disabled = false,
  cartItem,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { addItem, getQuantity, isHydrated } = useCart();

  const itemToAdd = cartItem ?? { productId };
  const quantity = isHydrated
    ? getQuantity(productId, itemToAdd.optionId)
    : 0;

  const handleAddToCart = () => {
    addItem(itemToAdd);
    const itemOptionDesc = itemToAdd.optionName
      ? `${productName} (${itemToAdd.optionName})`
      : productName;

    notify.success("Added to cart", {
      description: `${itemOptionDesc} was added to your cart.`,
      id: `cart-${productId}-${itemToAdd.optionId ?? "base"}`,
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart"),
      },
    });
  };

  const buttonText = disabled
    ? "Out of Stock"
    : variant === "card"
      ? "Add Cart"
      : quantity > 0
        ? `Add Another (${quantity} in cart)`
        : "Add to Cart";

  const buttonLabel = quantity > 0
    ? `Add another ${productName} to cart. ${quantity} already in cart.`
    : disabled
      ? `${productName} is out of stock`
      : `Add ${productName} to cart`;

  return (
    <button
      type="button"
      className={
        variant === "card"
          ? "product-action-button product-action-button--cart"
          : "btn btn--primary btn--lg"
      }
      disabled={!isHydrated || disabled}
      onClick={handleAddToCart}
      aria-label={buttonLabel}
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
        <circle cx="9" cy="20" r="1" />
        <circle cx="20" cy="20" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 6H6" />
      </svg>
      <span>{buttonText}</span>
    </button>
  );
}
