import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { getStoreProducts } from "@/data/products";
import type { ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "Checkout & Shopping Cart | Tech Solutions BD",
  description:
    "Review your digital software licenses and complete checkout securely with bKash, Nagad, or Rocket.",
};

export default async function CartPage() {
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
