import type { Metadata } from "next";
import { SITE_URL, SITE_NAME, DEFAULT_BANGLADESH_KEYWORDS } from "@/lib/seo";
import { ContactUs } from "@/components/home/ContactUs";
import { ExclusiveDeals } from "@/components/home/ExclusiveDeals";
import { Features } from "@/components/home/Features";
import { Hero } from "@/components/home/Hero";
import { HomeCategoryProducts } from "@/components/home/HomeCategoryProducts";
import { Marquee } from "@/components/home/Marquee";
import { Reviews } from "@/components/home/Reviews";
import { getStoreCategories, getStoreProducts } from "@/data/products";
import type { ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "Tech Solutions BD | Buy Genuine Software & Digital Licenses in Bangladesh",
  description:
    "Buy genuine Microsoft Windows 11/10 Pro keys, Office 2024, Office 365, Antivirus, IDM & Adobe licenses in Bangladesh with bKash, Nagad & Rocket. 100% Genuine, Lifetime Activation with Instant Delivery.",
  keywords: DEFAULT_BANGLADESH_KEYWORDS,
  alternates: {
    canonical: `${SITE_URL}/home`,
  },
  openGraph: {
    title: "Tech Solutions BD | Genuine Software & Digital Licenses in Bangladesh",
    description:
      "Buy genuine Windows 11/10 Pro keys, Office 2024, Office 365, IDM & Antivirus licenses in Bangladesh with bKash & Nagad. Instant digital delivery guaranteed.",
    url: `${SITE_URL}/home`,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_BD",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Tech Solutions BD - Genuine Digital Products Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Solutions BD | Genuine Software Licenses in Bangladesh",
    description:
      "Instant delivery of Windows 11, Office 2024, Antivirus & IDM licenses in Bangladesh via bKash, Nagad, Rocket.",
    images: ["/logo.png"],
  },
};

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
    isFeatured: product.isFeatured,
  }));

  const initialCategory =
    typeof query.category === "string" ? query.category : "all";
  const initialSearch = typeof query.search === "string" ? query.search : "";
  const isSearchActive = Boolean(initialSearch.trim());

  return (
    <main>
      {!isSearchActive && (
        <>
          <Hero
            categories={storeCategories}
            totalProducts={storeProducts.length}
          />
          <Marquee />
        </>
      )}

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
