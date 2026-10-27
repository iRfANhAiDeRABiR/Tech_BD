"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { scoreProductSearchMatch } from "@/lib/productSearch";
import type { ProductSummary, StoreCategory } from "@/types/product";

interface ProductGridProps {
  products: ProductSummary[];
  categories: StoreCategory[];
  initialCategory?: string;
  initialSearch?: string;
}

const categoryLabels: Record<string, string> = {
  all: "All",
  windows: "Windows",
  office: "Microsoft Office",
  "microsoft-office": "Microsoft Office",
  "365": "Microsoft 365",
  adobe: "Creativity & Design",
  "creativity-&-design": "Creativity & Design",
  "project-visio": "Project / Visio",
  vpn: "VPN",
  google: "Google",
  autodesk: "Autodesk",
  antivirus: "Antivirus",
  "top-Selling": "Top Selling",
  "top-selling": "Top Selling",
};

export function ProductGrid({
  products,
  categories,
  initialCategory = "all",
  initialSearch = "",
}: ProductGridProps) {
  const hasFeatured = products.some((product) => product.isFeatured);
  const categoriesWithProducts = new Set(
    products.map((product) => product.category),
  );
  if (hasFeatured) {
    categoriesWithProducts.add("top-Selling");
    categoriesWithProducts.add("top-selling");
  }
  const orderedCategorySlugs = categories
    .map((category) => category.slug)
    .filter((slug) => categoriesWithProducts.has(slug));
  const uncategorizedProductSlugs = products
    .map((product) => product.category)
    .filter((slug) => !orderedCategorySlugs.includes(slug));

  const availableCategories = [
    "all",
    ...Array.from(new Set([...orderedCategorySlugs, ...uncategorizedProductSlugs])),
  ];
  const categoryNames = Object.fromEntries(
    categories.map((category) => [category.slug, category.name]),
  );

  const validInitialCategory = availableCategories.includes(initialCategory)
    ? initialCategory
    : "all";

  const [activeCategory, setActiveCategory] =
    useState(validInitialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch.trim());

  const [visibleCount, setVisibleCount] = useState(8);

  const filteredProducts = useMemo(() => {
    const isTopSelling = activeCategory.toLowerCase() === "top-selling";
    const categoryFilteredProducts =
      activeCategory === "all"
        ? products
        : isTopSelling
          ? products.filter(
              (product) =>
                product.isFeatured || product.category === activeCategory,
            )
          : products.filter(
              (product) => product.category === activeCategory,
            );

    if (!searchTerm.trim()) {
      return categoryFilteredProducts;
    }

    return categoryFilteredProducts
      .map((product, index) => ({
        product,
        index,
        score: scoreProductSearchMatch(
          product,
          categoryNames[product.category] ?? categoryLabels[product.category] ?? product.category,
          searchTerm,
        ),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((result) => result.product);
  }, [activeCategory, categoryNames, products, searchTerm]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  function selectCategory(category: string) {
    setActiveCategory(category);
    setVisibleCount(8);

    const url = new URL(window.location.href);

    if (category === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", category);
    }

    if (searchTerm) {
      url.searchParams.set("search", searchTerm);
    } else {
      url.searchParams.delete("search");
    }

    url.hash = "products";
    window.history.replaceState({}, "", url);
  }

  function clearSearch() {
    setSearchTerm("");
    setVisibleCount(8);

    const url = new URL(window.location.href);
    url.searchParams.delete("search");
    url.hash = "products";
    window.history.replaceState({}, "", url);
  }

  return (
    <section className="products" id="products">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Shop Now</span>

          <h2 className="section-title">
            Featured <span className="gradient-text">Products</span>
          </h2>

          <p className="section-desc">
            Browse the currently available software catalogue
          </p>
        </div>

        <div className="filter-tabs" aria-label="Product categories">
          {availableCategories.map((category) => (
            <button
              type="button"
              key={category}
              className={`filter-tab ${
                activeCategory === category ? "active" : ""
              }`}
              onClick={() => selectCategory(category)}
            >
              {categoryNames[category] ?? categoryLabels[category] ?? category}
            </button>
          ))}
        </div>

        {searchTerm && (
          <div className="products-search-summary">
            <span>
              Showing results for <strong>“{searchTerm}”</strong>
            </span>

            <button type="button" onClick={clearSearch}>
              Clear search
            </button>
          </div>
        )}

        {visibleProducts.length > 0 ? (
          <div className="products__grid">
            {visibleProducts.map((product) => (
              <ProductCard product={product} key={product.id} showBuyNow />
            ))}
          </div>
        ) : (
          <div className="section-header">
            <p className="section-desc">
              {searchTerm
                ? "No products match your search. Try another keyword."
                : "No products are currently available in this category."}
            </p>
          </div>
        )}

        {visibleCount < filteredProducts.length && (
          <div className="products__more">
            <button
              type="button"
              className="btn btn--glass btn--lg"
              onClick={() => setVisibleCount((count) => count + 8)}
            >
              Load More Products
            </button>
          </div>
        )}
      </div>
    </section>
  );
}