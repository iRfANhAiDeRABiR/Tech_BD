import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { getStoreProducts } from "@/data/products";
import type { ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "Secure Checkout | Tech Solutions BD",
  description:
    "Complete your digital software license order with secure mobile banking payment.",
};

export default async function CheckoutPage() {
  const storeProducts = await getStoreProducts();
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

  return <CartPageClient products={productSummaries} />;
}

