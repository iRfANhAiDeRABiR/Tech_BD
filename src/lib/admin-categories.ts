import prisma from "@/lib/prisma";

export interface AdminCategoryOption {
  id: number;
  name: string;
}

const globalForCategories = globalThis as unknown as {
  adminCategoryOptions?: {
    data: AdminCategoryOption[];
    timestamp: number;
  };
};

// 5 minute in-memory cache for ultra-fast admin page loads
const CATEGORIES_CACHE_TTL_MS = 300_000;

export async function getAdminCategoryOptions(): Promise<AdminCategoryOption[]> {
  const now = Date.now();
  if (
    globalForCategories.adminCategoryOptions &&
    now - globalForCategories.adminCategoryOptions.timestamp < CATEGORIES_CACHE_TTL_MS
  ) {
    return globalForCategories.adminCategoryOptions.data;
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  globalForCategories.adminCategoryOptions = {
    data: categories,
    timestamp: now,
  };

  return categories;
}

export function invalidateCategoryOptionsCache(): void {
  globalForCategories.adminCategoryOptions = undefined;
}

