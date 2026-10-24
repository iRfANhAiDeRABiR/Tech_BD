import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";
import styles from "@/components/admin/AdminCategoriesManager.module.css";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/admin/categories"
              className={styles.btnActionEdit}
              style={{ textDecoration: "none", padding: "6px 12px" }}
            >
              <ArrowLeft size={14} />
              <span>Back to Categories</span>
            </Link>
          </div>
          <h1 className={styles.title} style={{ marginTop: 8 }}>
            Edit Category: {category.name}
          </h1>
          <p className={styles.subtitle}>
            Update category display settings, accent colors, and storefront visibility.
          </p>
        </div>
      </div>

      <CategoryForm
        submitLabel="Save Changes"
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
    </div>
  );
}
