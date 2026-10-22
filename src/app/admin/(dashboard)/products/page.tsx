import Link from "next/link";
import prisma from "@/lib/prisma";
import { ProductImportExport } from "@/components/admin/ProductImportExport";
import {
  AdminProductsManager,
  type AdminProductItem,
  type CategorySummary,
} from "@/components/admin/AdminProductsManager";
import styles from "../../admin.module.css";

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const [rawProducts, rawCategories, query] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        _count: { select: { options: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    }),
    searchParams,
  ]);

  const products: AdminProductItem[] = rawProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    badge: p.badge,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    status: p.status,
    outOfStock: p.outOfStock,
    sortOrder: p.sortOrder,
    updatedAt: p.updatedAt.toISOString(),
    category: {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
    },
    _count: {
      options: p._count.options,
    },
  }));

  const categories: CategorySummary[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    _count: {
      products: c._count.products,
    },
  }));

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>Products</h1>
          <p className={styles.muted}>
            Manage, find, track, and edit your catalog items in real-time.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <ProductImportExport />
          <Link className={styles.button} href="/admin/products/new">
            + Add product
          </Link>
        </div>
      </div>

      {query.saved && (
        <p className={styles.notice}>✓ Product saved and updated successfully.</p>
      )}
      {query.deleted && (
        <p className={styles.notice}>✓ Product catalog updated successfully.</p>
      )}

      <AdminProductsManager initialProducts={products} categories={categories} />
    </>
  );
}
