import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { getStoreProducts } from "@/data/products";
import type { ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description:
    "Review the digital products in your Tech Solutions BD shopping cart.",
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
