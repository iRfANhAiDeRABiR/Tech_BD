import Image from "next/image";
import Link from "next/link";
import type { StoreCategory } from "@/types/product";
import { getFloatingCategoryCards } from "./floatingCategories";
import styles from "./HeroShowcase.module.css";

interface HeroProps {
  categories?: StoreCategory[];
  totalProducts?: number;
}

export function Hero({ categories = [], totalProducts }: HeroProps) {
  const floatingCards = getFloatingCategoryCards(categories);
  const leftCards = floatingCards.filter((card) => card.column === "left");
  const rightCards = floatingCards.filter((card) => card.column === "right");

  const activeCategoriesCount =
    categories.filter((category) => category.count > 0).length ||
    categories.length ||
    4;
  const productsCount =
    totalProducts ??
    (categories.reduce((sum, category) => sum + category.count, 0) || 19);

  return (
    <section className="hero" id="home">
      <div className="hero__bg">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__orb hero__orb--3" />
      </div>

      <div className="container hero__container">
        {/* Left Side Content - 100% UNCHANGED */}
        <div className="hero__content">
          <div className="hero__badge">
            <span className="badge-dot" aria-hidden="true" />
            Fast digital delivery across Bangladesh
          </div>

          <h1 className="hero__title">
            Premium<br />
            <span className="gradient-text">Digital Software</span><br />
            at<br />
            competitive prices
          </h1>

          <p className="hero__description">
            Purchase software licenses and subscriptions with clear product
            information, local payment options and activation support.
          </p>

          <div className="hero__actions">
            <Link href="/home#features" className="btn btn--glass btn--lg">
              Why Choose Us
            </Link>
          </div>

          <div className="hero__stats">
            <div className="stat">
              <span className="stat__number">{productsCount}</span>
              <span className="stat__plus">+</span>
              <span className="stat__label">Products</span>
            </div>

            <div className="stat">
              <span className="stat__number">{activeCategoriesCount}</span>
              <span className="stat__plus">+</span>
              <span className="stat__label">Categories</span>
            </div>

            <div className="stat">
              <span className="stat__number">24/7</span>
              <span className="stat__label">Customer Support</span>
            </div>
          </div>
        </div>

        {/* Right Side Visual - Redesigned Premium Software Ecosystem Showcase */}
        <div className="hero__visual">
          <div className={styles.showcaseWrap}>
            <div className={styles.ambientBackdrop} aria-hidden="true" />
            <div className={styles.showcaseGrid}>
              <div className={styles.showcaseColumnLeft}>
                {leftCards.map((card) => (
                  <div
                    key={card.id}
                    className={styles.showcaseCard}
                    data-card-id={card.id}
                    role="group"
                    aria-label={card.name}
                  >
                    <div className={styles.iconBox}>
                      <Image
                        src={card.image}
                        alt=""
                        width={28}
                        height={28}
                        className={styles.cardImage}
                      />
                    </div>
                    <div className={styles.cardDetails}>
                      <span className={styles.cardName}>{card.name}</span>
                      <span className={styles.cardBadge}>{card.badge}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.showcaseColumnRight}>
                {rightCards.map((card) => (
                  <div
                    key={card.id}
                    className={styles.showcaseCard}
                    data-card-id={card.id}
                    role="group"
                    aria-label={card.name}
                  >
                    <div className={styles.iconBox}>
                      <Image
                        src={card.image}
                        alt=""
                        width={28}
                        height={28}
                        className={styles.cardImage}
                      />
                    </div>
                    <div className={styles.cardDetails}>
                      <span className={styles.cardName}>{card.name}</span>
                      <span className={styles.cardBadge}>{card.badge}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
