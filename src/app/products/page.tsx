import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Marquee } from "@/components/home/Marquee";
import { CategoryNav } from "@/components/products/CategoryNav";
import { CategoryRow } from "@/components/products/CategoryRow";
import { getStoreCategories, getStoreProducts } from "@/data/products";
import { scoreProductSearchMatch } from "@/lib/productSearch";
import type { Product, ProductSummary, StoreCategory } from "@/types/product";
import styles from "./products-page.module.css";

export const metadata: Metadata = {
  title: "Products by Category | Tech Solutions BD",
  description:
    "Browse genuine software licenses and subscriptions from Tech Solutions BD, grouped row-wise by category.",
};

interface CategoryProductGroup {
  slug: string;
  name: string;
  description: string;
  accent: string;
  products: ProductSummary[];
}

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string | string[];
  }>;
}

type CategoryAccentStyle = CSSProperties & {
  "--category-accent": string;
};

const getCategoryAccentStyle = (accent: string): CategoryAccentStyle => ({
  "--category-accent": accent,
});

const toProductSummary = (product: Product): ProductSummary => ({
  id: product.id,
  name: product.name,
  category: product.category,
  badge: product.badge,
  price: product.price,
  originalPrice: product.originalPrice,
  desc: product.desc,
  image: product.image,
  icon: product.icon,
  color: product.color,
  gradient: product.gradient,
  outOfStock: product.outOfStock,
  options: product.options,
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
    const categoryProducts = productsByCategory.get(category.slug) ?? [];

    if (!categoryProducts.length) {
      return [];
    }

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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = await searchParams;
  const [storeProducts, storeCategories] = await Promise.all([
    getStoreProducts(),
    getStoreCategories(),
  ]);

  const productSummaries = storeProducts.map(toProductSummary);
  const categoryGroups = createCategoryGroups(productSummaries, storeCategories);
  const initialSearch = typeof query.search === "string" ? query.search : "";
  const visibleCategoryGroups = filterCategoryGroupsBySearch(
    categoryGroups,
    initialSearch,
  );
  const totalProducts = productSummaries.length;

  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>Products by Category - Tech Solutions BD</h1>

      <Marquee />

      <div className={`container ${styles.categoryNavWrap}`} id="products-by-category">
        {initialSearch && (
          <div className="products-search-summary">
            <span>
              Showing product page results for <strong>“{initialSearch}”</strong>
            </span>

            <Link href="/products#products-by-category">Clear search</Link>
          </div>
        )}

        <CategoryNav
          groups={visibleCategoryGroups.map((group) => ({
            slug: group.slug,
            name: group.name,
            accent: group.accent,
            count: group.products.length,
          }))}
          totalCount={totalProducts}
        />
      </div>

      <div className={`container ${styles.categoryList}`}>
        {visibleCategoryGroups.map((group) => (
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
                  href={`/home?category=${group.slug}#products`}
                  className={styles.moreProductsLink}
                >
                  More Products
                </Link>
              </div>
            </div>

            <CategoryRow products={group.products} />
          </section>
        ))}

        {!visibleCategoryGroups.length && (
          <section className={styles.emptyState}>
            <h2>No products found</h2>
            <p>
              {initialSearch
                ? "No products match your search. Try another keyword."
                : "Please check back soon for new software licenses."}
            </p>
            <Link
              href={initialSearch ? "/products#products-by-category" : "/home"}
              className="btn btn--primary"
            >
              {initialSearch ? "Clear Search" : "Back to Home"}
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}