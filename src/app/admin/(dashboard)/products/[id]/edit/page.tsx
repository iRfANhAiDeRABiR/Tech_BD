import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminCategoryOptions } from "@/lib/admin-categories";
import styles from "../../../../admin.module.css";

async function getProductForEdit(idParam: string) {
  const rawId = idParam.trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch {
    // fallback
  }

  // 1. Direct primary key index seek (fastest, ~1ms)
  let product = await prisma.product.findUnique({
    where: { id: decodedId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  if (product) return product;

  // 2. If raw differs from decoded, try raw id
  if (rawId !== decodedId) {
    product = await prisma.product.findUnique({
      where: { id: rawId },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });
    if (product) return product;
  }

  // 3. Fallback to unique slug index seek
  product = await prisma.product.findUnique({
    where: { slug: decodedId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  if (product) return product;

  if (rawId !== decodedId) {
    product = await prisma.product.findUnique({
      where: { slug: rawId },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });
  }

  return product;
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const rawId = (await params).id?.trim();
  if (!rawId) notFound();

  const [product, categories] = await Promise.all([
    getProductForEdit(rawId),
    getAdminCategoryOptions(),
  ]);

  if (!product) notFound();

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>Edit product</h1>
          <p className={styles.muted}>{product.name}</p>
        </div>
        <Link className={styles.buttonSecondary} href="/admin/products">
          Back
        </Link>
      </div>
      <ProductForm categories={categories} product={product} />
    </>
  );
}
