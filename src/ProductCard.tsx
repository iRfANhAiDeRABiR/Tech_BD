"use client";

import Image from "next/image";
import { toPlainText } from "@/lib/text";
import type { ProductSummary } from "@/types/product";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const name = toPlainText(product.name);
  const description = toPlainText(product.desc);

  const rawBadge = product.badge?.trim();
  const badgeClass = rawBadge ? rawBadge.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
  const hasEmoji = Boolean(rawBadge && /^\p{Extended_Pictographic}/u.test(rawBadge));

  return (
    <article className="product-card">
      <div className="product-card__image-container">
        {rawBadge && (
          <span
            className={`product-card__badge product-card__badge--${badgeClass}`}
          >
            {!hasEmoji && <span className="product-card__badge-dot" aria-hidden="true" />}
            {rawBadge}
          </span>
        )}

        <div className="product-card__image">
          <Image
            src={product.image}
            alt={name}
            width={320}
            height={320}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      <div className="product-card__content">
        <span className="product-card__category">{product.category}</span>

        <h3 className="product-card__name">{name}</h3>

        <p className="product-card__desc">{description}</p>

        <div className="product-card__footer">
          <div className="product-card__price">
            <span className="price-current" suppressHydrationWarning>
              {formatPrice(product.price)}
            </span>

            {product.originalPrice && (
              <span className="price-original" suppressHydrationWarning>
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <span className="product-card__buy" aria-hidden="true">
            →
          </span>
        </div>
      </div>
    </article>
  );
}
