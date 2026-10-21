import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { StoreCategory } from "@/types/product";

interface CategoriesProps {
  categories: StoreCategory[];
}

export function Categories({ categories }: CategoriesProps) {
  return (
    <section className="categories" id="categories">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Browse</span>

          <h2 className="section-title">
            Product <span className="gradient-text">Categories</span>
          </h2>

          <p className="section-desc">
            Explore our current digital software catalogue
          </p>
        </div>

        <div className="categories__grid">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/home?category=${category.slug}#products`}
              className="category-card"
            >
              <div
                className="category-card__icon"
                style={
                  {
                    "--accent": category.accent,
                    background: "transparent",
                  } as CSSProperties
                }
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt=""
                    width={58}
                    height={58}
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <span aria-hidden="true">{category.name.charAt(0)}</span>
                )}
              </div>

              <h3>{category.name}</h3>
              <p>{category.description}</p>

              <span className="category-card__count">
                {category.count} Products
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}