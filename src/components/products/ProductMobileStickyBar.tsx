"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BuyNowButton } from "@/components/cart/BuyNowButton";
import { WhatsAppOrderButton } from "@/components/products/WhatsAppOrderButton";
import styles from "./ProductMobileStickyBar.module.css";

interface ProductMobileStickyBarProps {
  productId: string;
  productName: string;
  price: number;
  originalPrice: number | null;
  image: string;
  outOfStock?: boolean;
}

export function ProductMobileStickyBar({
  productId,
  productName,
  price,
  originalPrice,
  image,
  outOfStock = false,
}: ProductMobileStickyBarProps) {
  const { formatPrice } = useCurrency();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const triggerEl = document.getElementById("product-actions-trigger");

    if (!triggerEl) {
      // Fallback: show on scroll past 450px
      const handleScroll = () => {
        setIsVisible(window.scrollY > 450);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Visible when main actions are scrolled above the viewport
        setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      {
        threshold: 0,
        rootMargin: "-20px 0px 0px 0px",
      }
    );

    observer.observe(triggerEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isVisible) {
      document.body.setAttribute("data-sticky-visible", "true");
    } else {
      document.body.removeAttribute("data-sticky-visible");
    }

    return () => {
      document.body.removeAttribute("data-sticky-visible");
    };
  }, [isVisible]);

  return (
    <aside
      className={`${styles.stickyBar} ${isVisible ? styles.stickyBarVisible : ""}`}
      aria-label="Quick purchase actions"
      data-product-sticky-bar
    >
      <div className={styles.productMeta}>
        <div className={styles.thumb}>
          <Image
            src={image}
            alt={productName}
            width={40}
            height={40}
            className={styles.thumbImg}
          />
        </div>

        <div className={styles.textWrap}>
          <div className={styles.title}>{productName}</div>
          <div className={styles.priceWrap}>
            <span className={styles.currentPrice} suppressHydrationWarning>
              {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className={styles.originalPrice} suppressHydrationWarning>
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <WhatsAppOrderButton
          productId={productId}
          productName={productName}
          price={price}
          variant="iconOnly"
          className={styles.btnWa}
        />

        <AddToCartButton
          productId={productId}
          productName={productName}
          disabled={outOfStock}
          variant="detail"
          className={styles.btnCart}
        />

        <BuyNowButton
          productId={productId}
          productName={productName}
          disabled={outOfStock}
          variant="detail"
          className={styles.btnBuy}
        />
      </div>
    </aside>
  );
}

