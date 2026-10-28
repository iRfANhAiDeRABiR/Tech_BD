import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { CategoryProductsManager } from "@/components/admin/CategoryProductsManager";

export default async function CategoryProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; ordered?: string; removed?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) notFound();

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      accent: true,
    },
  });
  if (!category) notFound();

  const isTopSelling =
    category.id === 17 || category.slug.toLowerCase() === "top-selling";

  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: "asc" },
  });

  const memberProductsRaw = isTopSelling
    ? await prisma.product.findMany({
        where: {
          isFeatured: true,
          status: "ACTIVE",
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
    : await prisma.product.findMany({
        where: { categoryId },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

  const allProductsRaw = await prisma.product.findMany({
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  const memberIds = new Set(memberProductsRaw.map((p) => p.id));
  const availableProductsRaw = isTopSelling
    ? allProductsRaw.filter(
        (p) => !memberIds.has(p.id) && p.status === "ACTIVE",
      )
    : allProductsRaw.filter((p) => p.categoryId !== categoryId);

  const initialMemberProducts = memberProductsRaw.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    status: p.status,
    outOfStock: p.outOfStock,
    isFeatured: p.isFeatured,
    sortOrder: p.sortOrder,
    category: {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
    },
  }));

  const initialAvailableProducts = availableProductsRaw.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    status: p.status,
    outOfStock: p.outOfStock,
    isFeatured: p.isFeatured,
    sortOrder: p.sortOrder,
    category: {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
    },
  }));

  return (
    <CategoryProductsManager
      category={category}
      initialMemberProducts={initialMemberProducts}
      initialAvailableProducts={initialAvailableProducts}
      allCategories={allCategories}
      queryNotice={query}
    />
  );
}
