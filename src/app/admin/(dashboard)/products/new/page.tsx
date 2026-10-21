import Link from "next/link";
import prisma from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import styles from "../../../admin.module.css";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return <><div className={styles.header}><div><h1>Add product</h1><p className={styles.muted}>Create a storefront product and optional license variants.</p></div><Link className={styles.buttonSecondary} href="/admin/products">Back</Link></div><ProductForm categories={categories} /></>;
}