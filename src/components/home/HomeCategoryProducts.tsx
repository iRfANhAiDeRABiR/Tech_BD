import Link from "next/link";
import type { CSSProperties } from "react";
import { CategoryRow } from "@/components/products/CategoryRow";
import { scoreProductSearchMatch } from "@/lib/productSearch";
import type { ProductSummary, StoreCategory } from "@/types/product";
import styles from "./HomeCategoryProducts.module.css";

interface HomeCategoryProductsProps {
  products: ProductSummary[];
  categories: StoreCategory[];
  initialSearch?: string;
  initialCategory?: string;
}

interface CategoryProductGroup {
  slug: string;
  name: string;
  description: string;
  accent: string;
  products: ProductSummary[];
}

type CategoryAccentStyle = CSSProperties & {
  "--category-accent": string;
};

const getCategoryAccentStyle = (accent: string): CategoryAccentStyle => ({
  "--category-accent": accent,
});

const formatCategoryName = (slug: string) =>
  slug
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const createCategoryGroups = (
  products: ProductSummary[],
  categories: StoreCategory[],
): CategoryProductGroup[] => {
  const productsByCategory = new Map<string, ProductSummary[]>();

  products.forEach((product) => {
    const categoryProducts = productsByCategory.get(product.category) ?? [];
    categoryProducts.push(product);
    productsByCategory.set(product.category, categoryProducts);
  });

  const groupedCategorySlugs = new Set<string>();
  const orderedGroups = categories.flatMap((category) => {
    const isTopSelling = category.slug.toLowerCase() === "top-selling";
    const directProducts = productsByCategory.get(category.slug) ?? [];
    const rawCategoryProducts = isTopSelling
      ? (directProducts.length ? directProducts : products.filter((p) => p.isFeatured))
      : directProducts;

    if (!rawCategoryProducts.length) {
      return [];
    }

    const categoryProducts = [...rawCategoryProducts].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    groupedCategorySlugs.add(category.slug);

    return [
      {
        slug: category.slug,
        name: category.name,
        description: category.description,
        accent: category.accent,
        products: categoryProducts,
      },
    ];
  });

  const uncategorizedGroups = Array.from(productsByCategory.entries())
    .filter(([slug]) => !groupedCategorySlugs.has(slug))
    .map(([slug, categoryProducts]) => ({
      slug,
      name: formatCategoryName(slug),
      description: `Browse ${formatCategoryName(slug)} products.`,
      accent: "#6C63FF",
      products: categoryProducts,
    }));

  return [...orderedGroups, ...uncategorizedGroups];
};

const filterCategoryGroupsBySearch = (
  groups: CategoryProductGroup[],
  searchTerm: string,
) => {
  if (!searchTerm.trim()) {
    return groups;
  }

  return groups
    .map((group) => ({
      ...group,
      products: group.products
        .map((product, index) => ({
          product,
          index,
          score: scoreProductSearchMatch(product, group.name, searchTerm),
        }))
        .filter((result) => result.score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((result) => result.product),
    }))
    .filter((group) => group.products.length > 0);
};

export function HomeCategoryProducts({
  products,
  categories,
  initialSearch = "",
  initialCategory = "all",
}: HomeCategoryProductsProps) {
  const categoryGroups = createCategoryGroups(products, categories);

  let filteredGroups = filterCategoryGroupsBySearch(
    categoryGroups,
    initialSearch,
  );

  if (initialCategory && initialCategory !== "all") {
    const specificGroup = filteredGroups.filter(
      (g) => g.slug.toLowerCase() === initialCategory.toLowerCase(),
    );
    if (specificGroup.length > 0) {
      filteredGroups = specificGroup;
    }
  }

  return (
    <div className={`container ${styles.categoryList}`} id="products">
      {initialSearch && (
        <div className={styles.searchSummary}>
          <span>
            Showing search results for <strong>“{initialSearch}”</strong>
          </span>

          <Link href="/home#products" className={styles.clearSearchLink}>
            Clear search
          </Link>
        </div>
      )}

      {filteredGroups.map((group) => (
        <section
          className={styles.categorySection}
          id={group.slug}
          key={group.slug}
          style={getCategoryAccentStyle(group.accent)}
        >
          <div className={styles.categoryHeader}>
            <div>
              <span className={styles.categoryEyebrow}>Sorted category</span>
              <h2>{group.name}</h2>
              <p>{group.description}</p>
            </div>

            <div className={styles.categoryActions}>
              <span className={styles.categoryCount}>
                {group.products.length} product
                {group.products.length === 1 ? "" : "s"}
              </span>

              <Link
                href={`/products#${group.slug}`}
                className={styles.moreProductsLink}
              >
                More Products
              </Link>
            </div>
          </div>

          <CategoryRow products={group.products} />
        </section>
      ))}

      {!filteredGroups.length && (
        <section className={styles.emptyState}>
          <h2>No products found</h2>
          <p>
            {initialSearch
              ? "No products match your search. Try another keyword."
              : "Please check back soon for new software licenses."}
          </p>
          <Link href="/home" className="btn btn--primary">
            {initialSearch ? "Clear Search" : "Back to Home"}
          </Link>
        </section>
      )}
    </div>
  );
}
