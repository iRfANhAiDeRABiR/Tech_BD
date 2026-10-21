"use client";

import { type ReactNode, useMemo, useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BuyNowButton } from "@/components/cart/BuyNowButton";
import type { ProductOption } from "@/types/product";
import styles from "@/app/products/[id]/product.module.css";

interface ProductOptionSelectorProps {
  productId: string;
  productName: string;
  basePrice: number;
  baseOriginalPrice: number | null;
  options: ProductOption[];
  children?: ReactNode;
  outOfStock?: boolean;
}

function formatOptionType(type: ProductOption["type"]) {
  switch (type) {
    case "RETAIL_KEY":
      return "Retail";
    case "OEM_KEY":
      return "OEM";
    case "BIND_KEY":
      return "Bind";
    case "SUBSCRIPTION":
      return "Subscription";
    default:
      return "Other";
  }
}

export function ProductOptionSelector({
  productId,
  productName,
  basePrice,
  baseOriginalPrice,
  options,
  children,
  outOfStock = false,
}: ProductOptionSelectorProps) {
  const activeOptions = useMemo(
    () => options.filter((option) => option.price >= 0),
    [options],
  );

  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    activeOptions[0]?.id ?? "",
  );

  const selectedOption =
    activeOptions.find((option) => option.id === selectedOptionId) ??
    activeOptions[0] ??
    null;

  const selectedLabel = selectedOption
    ? formatOptionType(selectedOption.type)
    : "Standard";

  const currentPrice = selectedOption?.price ?? basePrice;
  const originalPrice = selectedOption?.originalPrice ?? baseOriginalPrice;
  const selectedCartItem = {
    productId,
    optionId: selectedOption?.id,
    optionName: selectedOption?.name,
    optionType: selectedOption ? selectedLabel : undefined,
    unitPrice: currentPrice,
    originalPrice,
  };

  const discount =
    originalPrice !== null && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  return (
    <>
      <div className={styles.priceBox}>
        <span className={styles.currentPrice}>
          ৳{currentPrice.toLocaleString("en-BD")}
        </span>

        {originalPrice !== null && (
          <span className={styles.originalPrice}>
            ৳{originalPrice.toLocaleString("en-BD")}
          </span>
        )}

        {discount !== null && (
          <span className={styles.discount}>Save {discount}%</span>
        )}
      </div>

      {children}

      {selectedOption && (
        <div className={styles.optionMeta}>
          <span className={styles.optionMetaLabel}>Type:</span>
          <span className={styles.optionMetaValue}>{selectedLabel}</span>
        </div>
      )}

      <div className={styles.optionSelector}>
        {activeOptions.map((option) => {
          const label = option.name?.trim() || formatOptionType(option.type);
          const isActive = option.id === selectedOption?.id;

          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.optionButton} ${
                isActive ? styles.optionButtonActive : ""
              }`}
              onClick={() => setSelectedOptionId(option.id)}
              aria-pressed={isActive}
            >
              {label}
            </button>
          );
        })}
      </div>

      {selectedOption?.description && (
        <p className={styles.optionDescription}>{selectedOption.description}</p>
      )}

      <div className={styles.actions}>
        <AddToCartButton
          productId={productId}
          productName={productName}
          disabled={outOfStock}
          cartItem={selectedCartItem}
        />
        <BuyNowButton
          productId={productId}
          productName={productName}
          disabled={outOfStock}
          cartItem={selectedCartItem}
        />
      </div>
    </>
  );
}