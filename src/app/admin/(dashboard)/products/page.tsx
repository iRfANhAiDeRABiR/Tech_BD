import prisma from "@/lib/prisma";
import { AdminProductsHeader } from "@/components/admin/AdminProductsHeader";
import {
  AdminProductsManager,
  type AdminProductItem,
  type CategorySummary,
} from "@/components/admin/AdminProductsManager";

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const [rawProducts, rawCategories, featuredCount, query] = await Promise.all([
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
    prisma.product.count({
      where: { isFeatured: true, status: "ACTIVE" },
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
    isFeatured: p.isFeatured,
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
      products:
        c.id === 17 || c.slug.toLowerCase() === "top-selling"
          ? Math.max(c._count.products, featuredCount)
          : c._count.products,
    },
  }));

  return (
    <>
      <AdminProductsHeader
        savedNotice={Boolean(query.saved)}
        deletedNotice={Boolean(query.deleted)}
      />
      <AdminProductsManager initialProducts={products} categories={categories} />
    </>
  );
}
