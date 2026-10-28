import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryRow } from "@/components/products/CategoryRow";
import { getStoreProducts, products } from "@/data/products";
import { sanitizeProductHtml } from "@/lib/sanitize-product-html";
import { toPlainText } from "@/lib/text";
import styles from "./product.module.css";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BuyNowButton } from "@/components/cart/BuyNowButton";
import { WhatsAppOrderButton } from "@/components/products/WhatsAppOrderButton";
import { ProductMobileStickyBar } from "@/components/products/ProductMobileStickyBar";
import { ProductOptionSelector } from "@/components/products/ProductOptionSelector";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import {
  SITE_URL,
  SITE_NAME,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

const categoryLabels: Record<string, string> = {
  windows: "Windows",
  office: "Microsoft Office",
  "365": "Microsoft 365",
  adobe: "Creativity & Design",
  "creativity-&-design": "Creativity & Design",
  "project-visio": "Project and Visio",
  vpn: "VPN",
  google: "Google",
  autodesk: "Engineering Tools",
  "engineering-tools": "Engineering Tools",
  antivirus: "Antivirus",
  "educational-tools": "Educational Tools",
  "ai-tools": "Ai Tools",
};

function decodeRouteId(value: string) {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function normalizeProductRouteValue(value: string) {
  return toPlainText(decodeRouteId(value))
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function findProductInCatalog(catalog: Awaited<ReturnType<typeof getStoreProducts>>, id: string) {
  const routeId = decodeRouteId(id);
  const normalizedRouteId = normalizeProductRouteValue(routeId);

  return catalog.find((product) => {
    if (product.id === routeId || product.slug === routeId) return true;

    return [product.id, product.slug, product.name]
      .filter((value): value is string => Boolean(value))
      .some((value) => normalizeProductRouteValue(value) === normalizedRouteId);
  });
}

async function findProduct(id: string) {
  return findProductInCatalog(await getStoreProducts(), id);
}

export function generateStaticParams() {
  return products.flatMap((product) => [
    { id: product.id },
    ...(product.slug ? [{ id: product.slug }] : []),
  ]);
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await findProduct(id);

  if (!product) {
    return {
      title: "Product Not Found | Tech Solutions BD",
    };
  }

  const name = toPlainText(product.name);
  const plainDesc = toPlainText(product.desc).slice(0, 150);
  const title = `${name} Price in Bangladesh | Buy Online with bKash - Tech Solutions BD`;
  const description = `Buy genuine ${name} at lowest price in Bangladesh (BDT ${product.price.toLocaleString("en-US")}). 100% Genuine license key, lifetime activation, instant delivery. Pay via bKash, Nagad, Rocket. ${plainDesc}`;
  const productUrl = `${SITE_URL}/products/${product.slug || product.id}`;
  const imageUrl = product.image.startsWith("http")
    ? product.image
    : `${SITE_URL}${product.image.startsWith("/") ? "" : "/"}${product.image}`;

  const categoryName = categoryLabels[product.category] ?? product.category;

  return {
    title,
    description,
    keywords: [
      `${name} price in Bangladesh`,
      `Buy ${name} Bangladesh`,
      `${name} key BD`,
      `${name} bKash`,
      `${name} retail key`,
      `${name} activation price BD`,
      `${categoryName} software Bangladesh`,
      "buy genuine software key Bangladesh",
      "digital license store BD",
      "সফটওয়্যার লাইসেন্স বাংলাদেশ",
    ],
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_BD",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: `${name} - Genuine Digital Product in Bangladesh`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    other: {
      "product:price:amount": String(product.price),
      "product:price:currency": "BDT",
      "product:availability": product.outOfStock ? "out of stock" : "in stock",
      "product:condition": "new",
      "product:retailer_item_id": product.id,
      "geo.region": "BD",
      "geo.placename": "Bangladesh",
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;
  const catalog = await getStoreProducts();
  const product = findProductInCatalog(catalog, id);

  if (!product) {
    notFound();
  }

  const name = toPlainText(product.name);
  const category =
    categoryLabels[product.category] ?? product.category;

  const rawBadge = product.badge?.trim();
  const normalizedBadge = rawBadge
    ? rawBadge.toLowerCase().replace(/[^a-z0-9]+/g, "_")
    : "";
  const hasEmoji = Boolean(
    rawBadge && /^\p{Extended_Pictographic}/u.test(rawBadge),
  );

  const originalPrice = product.originalPrice;

  const discount =
    originalPrice !== null && originalPrice > product.price
      ? Math.round(
        ((originalPrice - product.price) / originalPrice) * 100,
      )
      : null;

  const summaryHtml = sanitizeProductHtml(product.desc);

  const descriptionHtml = sanitizeProductHtml(
    product.longDesc || product.desc,
  );

  const sameCategoryProducts = catalog.filter(
    (candidate) =>
      candidate.category === product.category &&
      candidate.id !== product.id,
  );

  const fallbackProducts = catalog.filter(
    (candidate) =>
      candidate.category !== product.category &&
      candidate.id !== product.id,
  );

  const relatedProducts =
    sameCategoryProducts.length >= 10
      ? sameCategoryProducts
      : [
          ...sameCategoryProducts,
          ...fallbackProducts.slice(0, 10 - sameCategoryProducts.length),
        ];

  const productHighlights = (
    <section className={styles.summary}>
      <h2>Product highlights</h2>

      <div
        className={styles.content}
        dangerouslySetInnerHTML={{
          __html: summaryHtml,
        }}
      />
    </section>
  );

  const productJsonLd = generateProductJsonLd({
    id: product.id,
    slug: product.slug,
    name,
    description: toPlainText(product.desc),
    image: product.image,
    price: product.price,
    originalPrice: product.originalPrice,
    category,
    badge: product.badge,
    outOfStock: product.outOfStock,
  });

  const breadcrumbsJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Digital Products", url: "/products" },
    { name: category, url: `/products#${product.category}` },
    { name, url: `/products/${product.slug || product.id}` },
  ]);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <div className="container">
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/home">Home</Link>
          <span aria-hidden="true">/</span>

          <Link href="/products#products-by-category">Products</Link>
          <span aria-hidden="true">/</span>

          <span className={styles.breadcrumbCurrent}>{name}</span>
        </nav>

        <section className={styles.detail}>
          <div className={styles.imageColumn}>
            {rawBadge && (
              <span
                className={`${styles.badge} ${
                  normalizedBadge && styles[`badge_${normalizedBadge}`]
                    ? styles[`badge_${normalizedBadge}`]
                    : ""
                }`}
              >
                {!hasEmoji && (
                  <span className={styles.badgeDot} aria-hidden="true" />
                )}
                {rawBadge}
              </span>
            )}

            <Image
              src={product.image}
              alt={name}
              width={800}
              height={800}
              priority
              sizes="(max-width: 1000px) 100vw, 55vw"
              className={styles.productImage}
            />
          </div>

          <div className={styles.infoColumn}>
            <span className={styles.category}>{category}</span>

            <h1 className={styles.title}>{name}</h1>

            <p className={styles.brand}>
              Sold by <span>Tech Solutions BD</span>
            </p>

            {!product.options || product.options.length === 0 ? (
              <>
                <PriceDisplay
                  price={product.price}
                  originalPrice={originalPrice}
                  className={styles.priceBox}
                  currentPriceClassName={styles.currentPrice}
                  originalPriceClassName={styles.originalPrice}
                  discountClassName={styles.discount}
                />

                {productHighlights}

                <div className={styles.actions} id="product-actions-trigger">
                  <div className={styles.actionsRow}>
                    <AddToCartButton
                      productId={product.id}
                      productName={name}
                      disabled={product.outOfStock}
                    />

                    <BuyNowButton
                      productId={product.id}
                      productName={name}
                      disabled={product.outOfStock}
                    />
                  </div>

                  <WhatsAppOrderButton
                    productId={product.id}
                    productName={name}
                    price={product.price}
                    className={styles.whatsappFullBtn}
                  />
                </div>
              </>
            ) : null}

            {product.options && product.options.length > 0 && (
              <ProductOptionSelector
                productId={product.id}
                productName={name}
                basePrice={product.price}
                baseOriginalPrice={originalPrice}
                options={product.options}
                outOfStock={product.outOfStock}
              >
                {productHighlights}
              </ProductOptionSelector>
            )}

            {product.outOfStock && (
              <p className={styles.status}>
                <span aria-hidden="true">●</span> Currently out of stock
              </p>
            )}

            <dl className={styles.meta}>
              <div>
                <dt>Product ID</dt>
                <dd>{product.id}</dd>
              </div>

              <div>
                <dt>Category</dt>
                <dd>{category}</dd>
              </div>

              <div>
                <dt>Delivery</dt>
                <dd>Digital delivery</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={styles.description}>
          <h2 className={styles.descriptionTitle}>Product Description</h2>

          <div className={styles.descriptionCard}>
            {!/^\s*<h[12][^>]*>/i.test(descriptionHtml) && (
              <div className={styles.descriptionCardHeader}>
                <span className={styles.cardHeaderIcon}>
                  {product.icon || "💻"}
                </span>
                <h3 className={styles.cardHeaderTitle}>{name}</h3>
              </div>
            )}

            <div
              className={styles.content}
              dangerouslySetInnerHTML={{
                __html: descriptionHtml,
              }}
            />
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className={styles.related}>
            <div className="section-header">
              <span className="section-tag">You may also like</span>

              <h2 className="section-title">
                Related{" "}
                <span className="gradient-text">Products</span>
              </h2>
            </div>

            <CategoryRow products={relatedProducts} forceTwoRows />
          </section>
        )}
      </div>

      <ProductMobileStickyBar
        productId={product.id}
        productName={name}
        price={product.price}
        originalPrice={originalPrice}
        image={product.image}
        outOfStock={product.outOfStock}
      />
    </main>
  );
}
