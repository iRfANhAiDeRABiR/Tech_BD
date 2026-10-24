import prisma from "@/lib/prisma";
import {
  AdminCategoriesManager,
  type AdminCategoryItem,
} from "@/components/admin/AdminCategoriesManager";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; ordered?: string }>;
}) {
  const [rawCategories, query] = await Promise.all([
    prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { name: "asc" }],
    }),
    searchParams,
  ]);

  const categories: AdminCategoryItem[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    accent: c.accent,
    image: c.image,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    _count: {
      products: c._count.products,
    },
  }));

  return (
    <AdminCategoriesManager
      initialCategories={categories}
      notices={{
        saved: Boolean(query.saved),
        deleted: Boolean(query.deleted),
        ordered: Boolean(query.ordered),
      }}
    />
  );
}
