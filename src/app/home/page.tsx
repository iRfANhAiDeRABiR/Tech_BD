import { ContactUs } from "@/components/home/ContactUs";
import { ExclusiveDeals } from "@/components/home/ExclusiveDeals";
import { Features } from "@/components/home/Features";
import { Hero } from "@/components/home/Hero";
import { HomeCategoryProducts } from "@/components/home/HomeCategoryProducts";
import { Marquee } from "@/components/home/Marquee";
import { Reviews } from "@/components/home/Reviews";
import { getStoreCategories, getStoreProducts } from "@/data/products";
import type { ProductSummary } from "@/types/product";

interface HomePageProps {
  searchParams: Promise<{
    category?: string | string[];
    search?: string | string[];
  }>;
}

export default async function HomePage({
  searchParams,
}: HomePageProps) {
  const query = await searchParams;
  const [storeProducts, storeCategories] = await Promise.all([
    getStoreProducts(),
    getStoreCategories(),
  ]);
  const productSummaries: ProductSummary[] = storeProducts.map((product) => ({
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
  }));

  const initialCategory =
    typeof query.category === "string" ? query.category : "all";
  const initialSearch = typeof query.search === "string" ? query.search : "";

  return (
    <main>
      <Hero
        categories={storeCategories}
        totalProducts={storeProducts.length}
      />
      <Marquee />

      <HomeCategoryProducts
        products={productSummaries}
        categories={storeCategories}
        initialSearch={initialSearch}
        initialCategory={initialCategory}
      />

      <Features />
      <Reviews />
      <ExclusiveDeals />
      <ContactUs />
    </main>
  );
}