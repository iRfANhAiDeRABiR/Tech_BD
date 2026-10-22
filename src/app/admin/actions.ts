"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { deleteProductImage, uploadCategoryImage, uploadProductImage } from "@/lib/cloudinary";
import { parseProductForm } from "@/lib/admin-products";
import { invalidateStoreCatalogCache } from "@/data/products";
import {
  deleteSoftwareDownloadById,
  getSoftwareDownloadById,
  updateSoftwareDownloadsOrder,
  upsertSoftwareDownload,
} from "@/lib/software-downloads-store";
import type { SoftwareDownloadVariant, SoftwareVersionOption } from "@/data/software-downloads";

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

async function requireAdmin() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  return session;
}

export async function loginAction(formData: FormData) {
  try {
    const { signIn } = await import("@/auth");
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    const { AuthError } = await import("next-auth");

    if (error instanceof AuthError) redirect("/admin/login?error=invalid");
    throw error;
  }
}

export async function logoutAction() {
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/admin/login" });
}

type ParsedCategoryForm = {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  accent?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
};

function parseOptionalText(value: FormDataEntryValue | null, maxLength: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function parseRequiredText(value: FormDataEntryValue | null, fieldName: string, minLength: number, maxLength: number) {
  const text = String(value ?? "").trim();
  if (text.length < minLength || text.length > maxLength) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return text;
}

function parseIntegerField(value: FormDataEntryValue | null, fieldName: string) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) {
    throw new Error(`${fieldName} must be an integer.`);
  }
  return numberValue;
}

function parseOptionalPositiveInteger(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const numberValue = Number(text);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error("Category is invalid.");
  }
  return numberValue;
}

function parseOptionalProductId(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function parseCategoryForm(formData: FormData): ParsedCategoryForm {
  const id = parseOptionalPositiveInteger(formData.get("categoryId"));
  const name = parseRequiredText(formData.get("name"), "Name", 2, 100);
  const slug = parseRequiredText(formData.get("slug"), "Slug", 2, 120);
  const sortOrder = parseIntegerField(formData.get("sortOrder"), "Sort order");

  if (sortOrder < -9999 || sortOrder > 9999) {
    throw new Error("Sort order is invalid.");
  }

  return {
    id,
    name,
    slug,
    description: parseOptionalText(formData.get("description"), 2000),
    accent: parseOptionalText(formData.get("accent"), 40),
    imageUrl: parseOptionalText(formData.get("imageUrl"), 2048),
    sortOrder,
    isActive: formData.get("isActive") === "on",
  };
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();
  const data = parseProductForm(formData);
  const productId = parseOptionalProductId(formData.get("productId"));
  const existing = productId
    ? await prisma.product.findUnique({ where: { id: productId } })
    : null;

  const image = formData.get("image");
  let imageUrl = data.imageUrl || existing?.image || "";
  let imagePublicId = existing?.imagePublicId || null;

  if (image instanceof File && image.size > 0 && isCloudinaryConfigured()) {
    const uploaded = await uploadProductImage(image);
    await deleteProductImage(existing?.imagePublicId);
    imageUrl = uploaded.url;
    imagePublicId = uploaded.publicId;
  }

  if (!imageUrl) {
    throw new Error(
      isCloudinaryConfigured()
        ? "A product image or image URL is required."
        : "Cloudinary is not configured. Please use the image URL field instead of uploading a file.",
    );
  }

  const productData = {
    slug: data.slug,
    name: data.name,
    categoryId: data.categoryId,
    badge: data.badge || null,
    price: data.price,
    originalPrice: data.originalPrice ?? null,
    shortDescription: data.shortDescription,
    descriptionHtml: data.descriptionHtml,
    image: imageUrl,
    imagePublicId,
    icon: data.icon || null,
    color: data.color || null,
    gradient: data.gradient || null,
    status: data.status,
    isFeatured: data.isFeatured,
    outOfStock: data.outOfStock,
    sortOrder: data.sortOrder,
  };

  if (existing) {
    await prisma.$transaction(async (tx) => {
      const nextProductId = data.id ?? existing.id;

      if (nextProductId !== existing.id) {
        const conflictingProduct = await tx.product.findUnique({
          where: { id: nextProductId },
          select: { id: true },
        });

        if (conflictingProduct) {
          throw new Error("Product ID is already in use.");
        }
      }

      await tx.productOption.deleteMany({ where: { productId: existing.id } });
      await tx.product.update({
        where: { id: existing.id },
        data: { id: nextProductId, ...productData },
      });

      if (data.options.length) {
        await tx.productOption.createMany({
          data: data.options.map((option, index) => ({
            productId: nextProductId,
            name: option.name,
            type: option.type,
            sku: option.sku || null,
            price: option.price,
            originalPrice: option.originalPrice ?? null,
            description: option.description || null,
            isDefault: option.isDefault || (!data.options.some((item) => item.isDefault) && index === 0),
            isActive: option.isActive,
            sortOrder: option.sortOrder,
          })),
        });
      }
    });
  } else {
    await prisma.product.create({
      data: {
        id: data.id ?? data.slug,
        ...productData,
        options: {
          create: data.options.map((option, index) => ({
            name: option.name,
            type: option.type,
            sku: option.sku || null,
            price: option.price,
            originalPrice: option.originalPrice ?? null,
            description: option.description || null,
            isDefault: option.isDefault || (!data.options.some((item) => item.isDefault) && index === 0),
            isActive: option.isActive,
            sortOrder: option.sortOrder,
          })),
        },
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/admin");
  redirect("/admin/products?saved=1");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = parseOptionalProductId(formData.get("productId"));
  if (!id) throw new Error("Invalid product.");

  const product = await prisma.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!product) return;
  if (product._count.orderItems > 0) {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
  } else {
    await prisma.product.delete({ where: { id } });
    await deleteProductImage(product.imagePublicId);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin/products?deleted=1");
}

export async function toggleProductStockAction(formData: FormData) {
  await requireAdmin();
  const id = parseOptionalProductId(formData.get("productId"));
  if (!id) throw new Error("Invalid product.");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { outOfStock: true },
  });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: { outOfStock: !product.outOfStock },
  });

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
}

export async function toggleProductStatusAction(formData: FormData) {
  await requireAdmin();
  const id = parseOptionalProductId(formData.get("productId"));
  if (!id) throw new Error("Invalid product.");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!product) return;

  const nextStatus = product.status === "ACTIVE" ? "DRAFT" : "ACTIVE";

  await prisma.product.update({
    where: { id },
    data: { status: nextStatus },
  });

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
}

const editableOrderStatuses = ["PENDING_PAYMENT", "COMPLETED", "CANCELLED", "REFUNDED"] as const;

function parseEditableOrderStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? "").trim();
  if (!editableOrderStatuses.includes(status as (typeof editableOrderStatuses)[number])) {
    throw new Error("Invalid order status.");
  }

  return status as (typeof editableOrderStatuses)[number];
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = parseRequiredText(formData.get("orderId"), "Order", 1, 120);
  const status = parseEditableOrderStatus(formData.get("status"));
  const returnTo = String(formData.get("returnTo") ?? "/admin/orders");

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(returnTo.startsWith("/admin/orders") ? `${returnTo}${returnTo.includes("?") ? "&" : "?"}updated=1` : "/admin/orders?updated=1");
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  const data = parseCategoryForm(formData);
  const existing = data.id ? await prisma.category.findUnique({ where: { id: data.id } }) : null;
  const image = formData.get("image");
  let imageUrl = data.imageUrl || existing?.image || null;

  if (image instanceof File && image.size > 0 && isCloudinaryConfigured()) {
    const uploaded = await uploadCategoryImage(image);
    imageUrl = uploaded.url;
  }

  const values = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    accent: data.accent || null,
    image: imageUrl,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
  };

  if (data.id) await prisma.category.update({ where: { id: data.id }, data: values });
  else await prisma.category.create({ data: values });
  invalidateStoreCatalogCache();
  revalidatePath("/"); revalidatePath("/admin/categories"); redirect("/admin/categories?saved=1");
}

export async function saveCategoryOrderAction(formData: FormData) {
  await requireAdmin();

  const ids = formData.getAll("categoryId");
  const sortOrders = formData.getAll("sortOrder");
  const updates = ids
    .map((idValue, index) => ({
      id: Number(idValue),
      sortOrder: Number(sortOrders[index]),
    }))
    .filter(
      ({ id, sortOrder }) =>
        Number.isInteger(id) &&
        id > 0 &&
        Number.isInteger(sortOrder) &&
        sortOrder >= -9999 &&
        sortOrder <= 9999,
    );

  if (!updates.length) throw new Error("No valid category order values found.");

  await prisma.$transaction(
    updates.map(({ id, sortOrder }) =>
      prisma.category.update({ where: { id }, data: { sortOrder } }),
    ),
  );

  invalidateStoreCatalogCache();
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=1");
}

function buildUniqueSuffix(base: string, existingIds: Set<string>) {
  let candidate = base.slice(0, 120);
  while (existingIds.has(candidate)) {
    candidate = `${base.slice(0, 114)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  existingIds.add(candidate);
  return candidate;
}

export async function copyProductsToCategoryAction(formData: FormData) {
  await requireAdmin();

  const categoryId = Number(formData.get("categoryId"));
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error("Invalid category.");
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) throw new Error("Category not found.");

  const productIds = formData
    .getAll("productIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!productIds.length) {
    redirect(`/admin/categories/${categoryId}/products?added=0`);
  }

  const sourceProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, categoryId: { not: categoryId } },
    include: { options: true },
  });

  if (sourceProducts.length) {
    const takenIds = await prisma.product.findMany({
      where: { OR: sourceProducts.map((product) => ({ slug: { startsWith: product.slug } })) },
      select: { id: true, slug: true },
    });
    const takenValues = new Set<string>([
      ...takenIds.map((item) => item.id),
      ...takenIds.map((item) => item.slug),
    ]);

    const sourceSkus = sourceProducts
      .flatMap((product) => product.options)
      .map((option) => option.sku)
      .filter((sku): sku is string => Boolean(sku));
    const takenSkus = sourceSkus.length
      ? await prisma.productOption.findMany({
          where: { sku: { in: sourceSkus } },
          select: { sku: true },
        })
      : [];
    const takenSkuValues = new Set<string>(
      takenSkus.map((item) => item.sku).filter((sku): sku is string => Boolean(sku)),
    );

    await prisma.$transaction(async (tx) => {
      for (const product of sourceProducts) {
        const idBase = `${product.id}-c${categoryId}`;
        const slugBase = `${product.slug}-c${categoryId}`;
        const nextId = buildUniqueSuffix(idBase, takenValues);
        const nextSlug = buildUniqueSuffix(slugBase, takenValues);

        await tx.product.create({
          data: {
            id: nextId,
            slug: nextSlug,
            name: product.name,
            categoryId,
            badge: product.badge,
            price: product.price,
            originalPrice: product.originalPrice,
            shortDescription: product.shortDescription,
            descriptionHtml: product.descriptionHtml,
            image: product.image,
            imagePublicId: null,
            icon: product.icon,
            color: product.color,
            gradient: product.gradient,
            status: product.status,
            isFeatured: product.isFeatured,
            outOfStock: product.outOfStock,
            sortOrder: product.sortOrder,
            options: {
              create: product.options.map((option) => ({
                name: option.name,
                type: option.type,
                sku: option.sku
                  ? buildUniqueSuffix(`${option.sku}-c${categoryId}`, takenSkuValues)
                  : null,
                price: option.price,
                originalPrice: option.originalPrice,
                description: option.description,
                isDefault: option.isDefault,
                isActive: option.isActive,
                sortOrder: option.sortOrder,
              })),
            },
          },
        });
      }
    });
  }

  invalidateStoreCatalogCache();
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  redirect(`/admin/categories/${categoryId}/products?added=1`);
}

export async function saveCategoryProductOrderAction(formData: FormData) {
  await requireAdmin();

  const categoryId = Number(formData.get("categoryId"));
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error("Invalid category.");
  }

  const ids = formData.getAll("productId").map((value) => String(value).trim());
  const sortOrders = formData.getAll("sortOrder").map((value) => Number(value));
  const updates = ids
    .map((id, index) => ({ id, sortOrder: sortOrders[index] }))
    .filter(
      ({ id, sortOrder }) =>
        id &&
        Number.isInteger(sortOrder) &&
        sortOrder >= -9999 &&
        sortOrder <= 9999,
    );

  if (!updates.length) throw new Error("No valid product order values found.");

  await prisma.$transaction(
    updates.map(({ id, sortOrder }) =>
      prisma.product.updateMany({ where: { id, categoryId }, data: { sortOrder } }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  redirect(`/admin/categories/${categoryId}/products?ordered=1`);
}

export async function removeProductFromCategoryAction(formData: FormData) {
  await requireAdmin();

  const categoryId = Number(formData.get("categoryId"));
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error("Invalid category.");
  }

  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) throw new Error("Invalid product.");

  const product = await prisma.product.findFirst({
    where: { id: productId, categoryId },
    select: { id: true },
  });
  if (!product) return;

  await prisma.product.delete({ where: { id: product.id } });

  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  redirect(`/admin/categories/${categoryId}/products?removed=1`);
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("categoryId"));
  const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!category) return;
  if (category._count.products > 0) await prisma.category.update({ where: { id }, data: { isActive: false } });
  else await prisma.category.delete({ where: { id } });
  invalidateStoreCatalogCache();
  revalidatePath("/"); revalidatePath("/admin/categories"); redirect("/admin/categories?deleted=1");
}

export async function saveSoftwareDownloadAction(formData: FormData) {
  await requireAdmin();

  const rawId = String(formData.get("downloadId") ?? "").trim();
  const title = parseRequiredText(formData.get("title"), "Title / Name", 2, 120);
  const fullName = parseOptionalText(formData.get("fullName"), 240) || title;
  const badgeLabel = parseOptionalText(formData.get("badgeLabel"), 60);
  const category = parseOptionalText(formData.get("category"), 80) || "Office Suite";
  const rawVariant = (parseOptionalText(formData.get("variant"), 40) || "custom") as SoftwareDownloadVariant;
  const version = parseOptionalText(formData.get("version"), 80) || "Latest Official";
  const architecture = parseOptionalText(formData.get("architecture"), 80) || "32-bit / 64-bit";
  const fileSize = parseOptionalText(formData.get("fileSize"), 60) || "4.8 GB";
  const fileType = parseOptionalText(formData.get("fileType"), 60) || "ISO / IMG";
  const downloadUrl = parseRequiredText(formData.get("downloadUrl"), "Primary Download Link", 4, 2048);
  const productLink = parseOptionalText(formData.get("productLink"), 500) || "/products";
  const sortOrderRaw = Number(formData.get("sortOrder") ?? 10);
  const sortOrder = Number.isInteger(sortOrderRaw) ? Math.max(-9999, Math.min(9999, sortOrderRaw)) : 10;
  const isActive = formData.get("isActive") === "on";
  const clearImage = formData.get("clearImage") === "on";

  // Slug ID generation if new
  const slugId = rawId || (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `software-${Date.now()}`
  );

  const existing = rawId ? await getSoftwareDownloadById(rawId) : null;

  let imageUrl = clearImage ? "" : (parseOptionalText(formData.get("imageUrl"), 2048) ?? existing?.image ?? "");
  let imagePublicId = clearImage ? null : (existing?.imagePublicId ?? null);

  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    if (isCloudinaryConfigured()) {
      const uploaded = await uploadCategoryImage(imageFile);
      if (existing?.imagePublicId) {
        await deleteProductImage(existing.imagePublicId);
      }
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    } else {
      // Local storage fallback into public/img_content/
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `download-${Date.now()}-${safeName}`;
      const uploadDir = path.join(process.cwd(), "public", "img_content");
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), buffer);
      imageUrl = `/img_content/${filename}`;
      imagePublicId = null;
    }
  }

  // Parse dynamic multi-version links
  const versionLabels = formData.getAll("versionLabel").map((v) => String(v).trim());
  const versionUrls = formData.getAll("versionUrl").map((v) => String(v).trim());
  const versionArchs = formData.getAll("versionArch").map((v) => String(v).trim());

  const versions: SoftwareVersionOption[] = [];
  for (let i = 0; i < versionLabels.length; i++) {
    const vLabel = versionLabels[i];
    const vUrl = versionUrls[i];
    const vArch = versionArchs[i];
    if (vLabel && vUrl) {
      versions.push({
        label: vLabel,
        url: vUrl,
        arch: vArch || undefined,
      });
    }
  }

  await upsertSoftwareDownload({
    id: slugId,
    title,
    fullName,
    badgeLabel: badgeLabel || title,
    category,
    variant: rawVariant,
    version,
    architecture,
    fileSize,
    fileType,
    downloadUrl,
    productLink,
    sortOrder,
    isActive,
    image: imageUrl || null,
    imagePublicId: imagePublicId || null,
    versions,
  });

  revalidatePath("/downloads");
  revalidatePath("/admin/downloads");
  revalidatePath("/admin");
  redirect("/admin/downloads?saved=1");
}

export async function deleteSoftwareDownloadAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("downloadId") ?? "").trim();
  if (!id) throw new Error("Invalid software download id.");

  const existing = await getSoftwareDownloadById(id);
  if (existing?.imagePublicId && isCloudinaryConfigured()) {
    await deleteProductImage(existing.imagePublicId);
  }

  await deleteSoftwareDownloadById(id);

  revalidatePath("/downloads");
  revalidatePath("/admin/downloads");
  revalidatePath("/admin");
  redirect("/admin/downloads?deleted=1");
}

export async function saveSoftwareDownloadOrderAction(formData: FormData) {
  await requireAdmin();

  const ids = formData.getAll("downloadId").map((v) => String(v).trim());
  const sortOrders = formData.getAll("sortOrder").map((v) => Number(v));

  const updates = ids
    .map((id, index) => ({ id, sortOrder: sortOrders[index] }))
    .filter(
      ({ id, sortOrder }) =>
        id &&
        Number.isInteger(sortOrder) &&
        sortOrder >= -9999 &&
        sortOrder <= 9999,
    );

  if (!updates.length) {
    throw new Error("No valid download order values found.");
  }

  await updateSoftwareDownloadsOrder(updates);

  revalidatePath("/downloads");
  revalidatePath("/admin/downloads");
  revalidatePath("/admin");
  redirect("/admin/downloads?ordered=1");
}