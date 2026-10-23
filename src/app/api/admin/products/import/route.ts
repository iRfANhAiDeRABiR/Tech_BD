import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { invalidateStoreCatalogCache } from "@/data/products";
import type { ProductStatus, ProductOptionType } from "@/generated/prisma/client";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const cleanText = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.some((c) => c.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((c) => c.trim() !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length >= 2 ? slug : `product-${Date.now()}`;
}

const VALID_STATUSES = new Set<ProductStatus>(["ACTIVE", "DRAFT", "ARCHIVED"]);
const VALID_OPTION_TYPES = new Set<ProductOptionType>([
  "RETAIL_KEY",
  "BIND_KEY",
  "OEM_KEY",
  "SUBSCRIPTION",
  "OTHER",
]);

interface ParsedImportItem {
  id?: string;
  slug?: string;
  name: string;
  categoryNameOrSlug?: string;
  price: number;
  originalPrice?: number | null;
  badge?: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  outOfStock: boolean;
  sortOrder: number;
  image: string;
  shortDescription: string;
  descriptionHtml: string;
  options?: Array<{
    name: string;
    type?: string;
    price?: number;
    originalPrice?: number | null;
    sku?: string | null;
    description?: string | null;
    isDefault?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  }>;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const updateExisting = formData.get("updateExisting") !== "false";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const fileName = file.name.toLowerCase();
    const items: ParsedImportItem[] = [];

    if (fileName.endsWith(".json")) {
      try {
        const parsed = JSON.parse(text);
        const rawArray = Array.isArray(parsed) ? parsed : [parsed];
        for (const raw of rawArray) {
          if (!raw.name) continue;
          items.push({
            id: raw.id ? String(raw.id).trim() : undefined,
            slug: raw.slug ? String(raw.slug).trim() : undefined,
            name: String(raw.name).trim(),
            categoryNameOrSlug: raw.category || raw.categorySlug || raw.categoryId,
            price: Math.max(0, parseInt(raw.price, 10) || 0),
            originalPrice: raw.originalPrice ? parseInt(raw.originalPrice, 10) : null,
            badge: raw.badge ? String(raw.badge).trim() : null,
            status: VALID_STATUSES.has(raw.status) ? raw.status : "ACTIVE",
            isFeatured: Boolean(raw.isFeatured),
            outOfStock: Boolean(raw.outOfStock),
            sortOrder: parseInt(raw.sortOrder, 10) || 0,
            image: raw.image ? String(raw.image).trim() : "/file.svg",
            shortDescription: raw.shortDescription ? String(raw.shortDescription).trim() : String(raw.name),
            descriptionHtml: raw.descriptionHtml ? String(raw.descriptionHtml).trim() : `<p>${raw.name}</p>`,
            options: Array.isArray(raw.options) ? raw.options : undefined,
          });
        }
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid JSON format" },
          { status: 400 }
        );
      }
    } else {
      // CSV format
      const csvRows = parseCsv(text);
      if (csvRows.length < 2) {
        return NextResponse.json(
          { success: false, message: "CSV file is empty or missing data rows" },
          { status: 400 }
        );
      }

      const headers = csvRows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
      const getCol = (row: string[], colName: string) => {
        const idx = headers.indexOf(colName.toLowerCase());
        return idx !== -1 ? row[idx]?.trim() : "";
      };

      for (let i = 1; i < csvRows.length; i++) {
        const row = csvRows[i];
        const name = getCol(row, "name");
        if (!name) continue;

        let options: ParsedImportItem["options"] = undefined;
        const optionsRaw = getCol(row, "options");
        if (optionsRaw) {
          try {
            const parsedOpt = JSON.parse(optionsRaw);
            if (Array.isArray(parsedOpt)) options = parsedOpt;
          } catch {
            // Ignored if options column is plain text
          }
        }

        const statusRaw = getCol(row, "status").toUpperCase();
        const status = VALID_STATUSES.has(statusRaw as ProductStatus)
          ? (statusRaw as ProductStatus)
          : "ACTIVE";

        const isFeaturedRaw = getCol(row, "isfeatured").toLowerCase();
        const outOfStockRaw = getCol(row, "outofstock").toLowerCase();

        items.push({
          id: getCol(row, "id") || undefined,
          slug: getCol(row, "slug") || undefined,
          name,
          categoryNameOrSlug: getCol(row, "category") || undefined,
          price: Math.max(0, parseInt(getCol(row, "price"), 10) || 0),
          originalPrice: getCol(row, "originalprice")
            ? parseInt(getCol(row, "originalprice"), 10)
            : null,
          badge: getCol(row, "badge") || null,
          status,
          isFeatured: isFeaturedRaw === "true" || isFeaturedRaw === "1",
          outOfStock: outOfStockRaw === "true" || outOfStockRaw === "1",
          sortOrder: parseInt(getCol(row, "sortorder"), 10) || 0,
          image: getCol(row, "image") || "/file.svg",
          shortDescription: getCol(row, "shortdescription") || name,
          descriptionHtml: getCol(row, "descriptionhtml") || `<p>${name}</p>`,
          options,
        });
      }
    }

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid product rows found to import" },
        { status: 400 }
      );
    }

    // Cache existing categories
    const categories = await prisma.category.findMany();
    const categoryMap = new Map<string, number>();

    for (const c of categories) {
      categoryMap.set(c.slug.toLowerCase(), c.id);
      categoryMap.set(c.name.toLowerCase(), c.id);
      categoryMap.set(String(c.id), c.id);
    }

    // Default category fallback
    let defaultCategoryId = categories[0]?.id;
    if (!defaultCategoryId) {
      const createdDefault = await prisma.category.create({
        data: {
          name: "General",
          slug: "general",
          description: "General product category",
          sortOrder: 0,
          isActive: true,
        },
      });
      defaultCategoryId = createdDefault.id;
      categoryMap.set("general", defaultCategoryId);
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNum = i + 1;

      try {
        // Resolve category
        let categoryId = defaultCategoryId;
        if (item.categoryNameOrSlug) {
          const matchedId = categoryMap.get(item.categoryNameOrSlug.toLowerCase());
          if (matchedId) {
            categoryId = matchedId;
          } else {
            // Auto-create category if doesn't exist
            const newSlug = slugify(item.categoryNameOrSlug);
            const newCategory = await prisma.category.create({
              data: {
                name: item.categoryNameOrSlug,
                slug: newSlug,
                sortOrder: 0,
                isActive: true,
              },
            });
            categoryId = newCategory.id;
            categoryMap.set(newCategory.slug.toLowerCase(), categoryId);
            categoryMap.set(newCategory.name.toLowerCase(), categoryId);
          }
        }

        const targetSlug = item.slug ? slugify(item.slug) : slugify(item.name);
        const targetId = item.id || targetSlug;

        // Check if exists
        const existing = await prisma.product.findFirst({
          where: {
            OR: [{ id: targetId }, { slug: targetSlug }],
          },
          select: { id: true, slug: true },
        });

        if (existing && !updateExisting) {
          errors.push(`Row ${rowNum} (${item.name}): Skipped because product already exists and updateExisting is false.`);
          continue;
        }

        const productData = {
          name: item.name,
          categoryId,
          badge: item.badge,
          price: item.price,
          originalPrice: item.originalPrice,
          shortDescription: item.shortDescription,
          descriptionHtml: item.descriptionHtml,
          image: item.image,
          status: item.status,
          isFeatured: item.isFeatured,
          outOfStock: item.outOfStock,
          sortOrder: item.sortOrder,
        };

        if (existing) {
          // Update product
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              ...productData,
              slug: targetSlug,
            },
          });

          // If options provided, update options
          if (item.options && Array.isArray(item.options)) {
            await prisma.productOption.deleteMany({ where: { productId: existing.id } });
            if (item.options.length > 0) {
              await prisma.productOption.createMany({
                data: item.options.map((opt, optIdx) => ({
                  productId: existing.id,
                  name: opt.name || `Option ${optIdx + 1}`,
                  type: (opt.type && VALID_OPTION_TYPES.has(opt.type as ProductOptionType))
                    ? (opt.type as ProductOptionType)
                    : "OTHER",
                  sku: opt.sku || null,
                  price: opt.price ? Math.max(0, parseInt(String(opt.price), 10) || 0) : item.price,
                  originalPrice: opt.originalPrice ? parseInt(String(opt.originalPrice), 10) : null,
                  description: opt.description || null,
                  isDefault: Boolean(opt.isDefault) || optIdx === 0,
                  isActive: opt.isActive !== false,
                  sortOrder: opt.sortOrder ?? optIdx,
                })),
              });
            }
          }
          updatedCount++;
        } else {
          // Create product
          await prisma.product.create({
            data: {
              id: targetId,
              slug: targetSlug,
              ...productData,
              options: item.options && item.options.length > 0
                ? {
                    create: item.options.map((opt, optIdx) => ({
                      name: opt.name || `Option ${optIdx + 1}`,
                      type: (opt.type && VALID_OPTION_TYPES.has(opt.type as ProductOptionType))
                        ? (opt.type as ProductOptionType)
                        : "OTHER",
                      sku: opt.sku || null,
                      price: opt.price ? Math.max(0, parseInt(String(opt.price), 10) || 0) : item.price,
                      originalPrice: opt.originalPrice ? parseInt(String(opt.originalPrice), 10) : null,
                      description: opt.description || null,
                      isDefault: Boolean(opt.isDefault) || optIdx === 0,
                      isActive: opt.isActive !== false,
                      sortOrder: opt.sortOrder ?? optIdx,
                    })),
                  }
                : undefined,
            },
          });
          createdCount++;
        }
      } catch (err) {
        console.error(`Error importing row ${rowNum}:`, err);
        errors.push(`Row ${rowNum} (${item.name}): ${err instanceof Error ? err.message : "Unknown database error"}`);
      }
    }

    invalidateStoreCatalogCache();
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/products");
    revalidatePath("/products/[id]", "page");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/admin");
    revalidatePath("/admin/products");

    return NextResponse.json({
      success: true,
      count: items.length,
      created: createdCount,
      updated: updatedCount,
      errors,
    });
  } catch (error) {
    console.error("Product import error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to import products",
      },
      { status: 500 }
    );
  }
}

