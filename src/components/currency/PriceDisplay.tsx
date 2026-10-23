"use client";

import { useCurrency } from "@/context/CurrencyContext";

interface PriceDisplayProps {
  price: number;
  originalPrice?: number | null;
  className?: string;
  style?: React.CSSProperties;
  currentPriceClassName?: string;
  originalPriceClassName?: string;
  discountClassName?: string;
  showDiscount?: boolean;
  inline?: boolean;
}

export function PriceDisplay({
  price,
  originalPrice,
  className,
  style,
  currentPriceClassName,
  originalPriceClassName,
  discountClassName,
  showDiscount = true,
  inline = false,
}: PriceDisplayProps) {
  const { formatPrice } = useCurrency();
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const Tag = inline ? "span" : "div";

  return (
    <Tag className={className} style={style} suppressHydrationWarning>
      <span className={currentPriceClassName} suppressHydrationWarning>
        {formatPrice(price)}
      </span>

      {originalPrice !== null && originalPrice !== undefined && (
        <span className={originalPriceClassName} suppressHydrationWarning>
          {formatPrice(originalPrice)}
        </span>
      )}

      {showDiscount && discount !== null && (
        <span className={discountClassName}>Save {discount}%</span>
      )}
    </Tag>
  );
}

