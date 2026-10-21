import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";
import styles from "../../../../admin.module.css";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return <>
    <div className={styles.header}>
      <div><h1>Edit category</h1><p className={styles.muted}>{category.name}</p></div>
      <Link className={styles.buttonSecondary} href="/admin/categories">Back</Link>
    </div>
    <CategoryForm
      submitLabel="Update category"
      category={{
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        accent: category.accent,
        image: category.image,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      }}
    />
  </>;
}