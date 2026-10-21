import Link from "next/link";
import prisma from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { deleteCategoryAction, saveCategoryOrderAction } from "../../actions";
import styles from "../../admin.module.css";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const [categories, query] = await Promise.all([
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { name: "asc" }],
    }),
    searchParams,
  ]);

  return <>
    <div className={styles.header}>
      <div>
        <h1>Categories</h1>
        <p className={styles.muted}>Create, edit, upload images, and manage category descriptions.</p>
      </div>
    </div>

    {(query.saved || query.deleted) && <p className={styles.notice}>Category list updated.</p>}

    <CategoryForm submitLabel="Add category" />

    <div className={styles.orderHeader}>
      <div>
        <h2>Category serial order</h2>
        <p className={styles.muted}>Lower serial numbers show first on the website. Newly added categories can be placed last by giving them a higher number.</p>
      </div>
      <form id="category-order-form" action={saveCategoryOrderAction} />
      <button form="category-order-form" className={styles.button} type="submit">Save order</button>
    </div>

    <div className={styles.tableWrap} style={{ marginTop: 24 }}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Serial No.</th>
            <th>Image</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Products</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => <tr key={category.id}>
            <td>
              <input form="category-order-form" type="hidden" name="categoryId" value={category.id} />
              <input
                form="category-order-form"
                className={styles.serialInput}
                name="sortOrder"
                type="number"
                min="-9999"
                max="9999"
                defaultValue={category.sortOrder}
                aria-label={`${category.name} serial number`}
              />
            </td>
            <td>{category.image ? <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={category.image} alt={category.name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }} />
            </> : "-"}</td>
            <td>{category.name}</td>
            <td>{category.slug}</td>
            <td>{category._count.products}</td>
            <td>{category.isActive ? "Yes" : "No"}</td>
            <td>
              <div className={styles.actions} style={{ margin: 0 }}>
                <Link className={styles.buttonSecondary} href={`/admin/categories/${category.id}/products`}>Add products</Link>
                <Link className={styles.buttonSecondary} href={`/admin/categories/${category.id}/edit`}>Edit</Link>
                <form action={deleteCategoryAction}><input type="hidden" name="categoryId" value={category.id} /><button className={styles.danger} type="submit">Delete</button></form>
              </div>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </>;
}