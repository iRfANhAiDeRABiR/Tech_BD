"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BuyNowButton } from "@/components/cart/BuyNowButton";
import { toPlainText } from "@/lib/text";
import { useCurrency } from "@/context/CurrencyContext";
import type { ProductSummary } from "@/types/product";

interface ProductCardProps {
  product: ProductSummary;
  showBuyNow?: boolean;
}

export function ProductCard({ product, showBuyNow = false }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const name = toPlainText(product.name);
  const rawBadge = product.badge?.trim();
  const badgeClass = rawBadge ? rawBadge.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
  const badgeLabel = rawBadge ? rawBadge.charAt(0).toUpperCase() + rawBadge.slice(1) : "";
  const hasEmoji = Boolean(rawBadge && /^\p{Extended_Pictographic}/u.test(rawBadge));
  const productHref = `/products/${encodeURIComponent(product.slug ?? product.id)}`;

  return (
    <article className="product-card">
      <Link
        href={productHref}
        className="product-card__details"
        aria-label={`View ${name} details`}
      >
        <div className="product-card__image-container">
          {rawBadge && (
            <span
              className={`product-card__badge product-card__badge--${badgeClass}`}
            >
              {!hasEmoji && <span className="product-card__badge-dot" aria-hidden="true" />}
              {badgeLabel}
            </span>
          )}

          <div className="product-card__image">
            <Image
              src={product.image}
              alt={name}
              width={320}
              height={320}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>

        <div className="product-card__content">
          <h3 className="product-card__name">{name}</h3>

          <div className="product-card__footer">
            <div className="product-card__price">
              <span className="price-current">
                {formatPrice(product.price)}
              </span>

              {product.originalPrice !== null && (
                <span className="price-original">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div
        className={`product-card__actions ${
          showBuyNow ? "product-card__actions--split" : "product-card__actions--single"
        }`}
      >
        <AddToCartButton
          productId={product.id}
          productName={name}
          variant="card"
          disabled={product.outOfStock}
        />

        {showBuyNow && (
          <BuyNowButton
            productId={product.id}
            productName={name}
            variant="card"
            disabled={product.outOfStock}
          />
        )}
      </div>
    </article>
  );
}
