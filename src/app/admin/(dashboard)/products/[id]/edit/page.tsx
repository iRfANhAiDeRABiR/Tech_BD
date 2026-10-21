import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import styles from "../../../../admin.module.css";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id.trim();
  if (!id) notFound();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { options: { orderBy: { sortOrder: "asc" } } } }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  return <><div className={styles.header}><div><h1>Edit product</h1><p className={styles.muted}>{product.name}</p></div><Link className={styles.buttonSecondary} href="/admin/products">Back</Link></div><ProductForm categories={categories} product={product} /></>;
}