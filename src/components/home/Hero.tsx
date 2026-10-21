import Image from "next/image";
import Link from "next/link";
import type { StoreCategory } from "@/types/product";
import { getFloatingCategoryCards } from "./floatingCategories";

interface HeroProps {
  categories?: StoreCategory[];
  totalProducts?: number;
}

export function Hero({ categories = [], totalProducts }: HeroProps) {
  const floatingCards = getFloatingCategoryCards(categories);
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
        <div className="hero__content">
          <div className="hero__badge">
            <span className="badge-dot" aria-hidden="true" />
            Fast digital delivery across Bangladesh
          </div>

          <h1 className="hero__title">
            Premium<br />
            <span className="gradient-text">Digital Software</span><br />
            at competitive prices
          </h1>

          <p className="hero__description">
            Purchase software licenses and subscriptions with clear product
            information, local payment options and activation support.
          </p>

          <div className="hero__actions">
            <Link href="/products#products-by-category" className="btn btn--primary btn--lg">
              Browse Products →
            </Link>

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

        <div className="hero__visual">
          <div className="floating-cards">
            {floatingCards.map((card, index) => (
              <div
                key={card.name}
                className={`float-card float-card--${index + 1}`}
              >
                <div
                  className="float-card__icon"
                  style={{ background: "transparent" }}
                >
                  <Image
                    src={card.image}
                    alt=""
                    width={40}
                    height={40}
                    style={{ objectFit: "contain" }}
                  />
                </div>

                <span>{card.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}