import type { MetadataRoute } from "next";
import { getStoreProducts, getStoreCategories } from "@/data/products";
import { TOOLS } from "@/data/tools";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products] = await Promise.all([
    getStoreProducts(),
    getStoreCategories(),
  ]);

  const now = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/downloads`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/order/verify`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/policies/delivery-info`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/policies/order-and-cancellation`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/policies/privacy-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/policies/refund-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/policies/terms-and-conditions`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic Product routes
  const productRoutes: MetadataRoute.Sitemap = products.flatMap((product) => {
    const urls: MetadataRoute.Sitemap = [
      {
        url: `${SITE_URL}/products/${product.id}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      },
    ];
    if (product.slug && product.slug !== product.id) {
      urls.push({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
    return urls;
  });

  // Dynamic Tool routes
  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${SITE_URL}/tools/${t.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...toolRoutes];
}
