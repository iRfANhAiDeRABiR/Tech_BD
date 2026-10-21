import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  copyProductsToCategoryAction,
  removeProductFromCategoryAction,
  saveCategoryProductOrderAction,
} from "../../../../actions";
import styles from "../../../../admin.module.css";

export default async function CategoryProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; ordered?: string; removed?: string; q?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) notFound();

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) notFound();

  const search = (query.q ?? "").trim();
  const products = await prisma.product.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { category: { select: { name: true } } },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  const memberProducts = await prisma.product.findMany({
    where: { categoryId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const availableProducts = products.filter((product) => product.categoryId !== categoryId);

  return <>
    <div className={styles.header}>
      <div>
        <h1>Add products to “{category.name}”</h1>
        <p className={styles.muted}>
          Select existing products below to copy them into this category. The originals stay in their current category.
        </p>
      </div>
      <Link className={styles.buttonSecondary} href="/admin/categories">Back</Link>
    </div>

    {query.added === "1" && <p className={styles.notice}>Products copied to “{category.name}”.</p>}
    {query.added === "0" && <p className={styles.notice}>No products were selected.</p>}
    {query.ordered === "1" && <p className={styles.notice}>Product order updated.</p>}
    {query.removed === "1" && <p className={styles.notice}>Product removed from “{category.name}”.</p>}

    <form className={styles.searchBar} method="get">
      <div className={styles.field}>
        <label htmlFor="product-search">Search products</label>
        <input id="product-search" name="q" type="search" defaultValue={search} placeholder="Search by name or slug" />
      </div>
      <button className={styles.buttonSecondary} type="submit">Search</button>
    </form>

    {memberProducts.length > 0 && <>
      <div className={styles.orderHeader}>
        <div>
          <h2>Already in this category ({memberProducts.length})</h2>
          <p className={styles.muted}>Lower serial numbers show first on the website.</p>
        </div>
        <form id="member-order-form" action={saveCategoryProductOrderAction}>
          <input type="hidden" name="categoryId" value={category.id} />
        </form>
        <button form="member-order-form" className={styles.button} type="submit">Save order</button>
      </div>
      <div className={styles.tableWrap} style={{ marginTop: 12 }}>
        <table className={styles.table}>
          <thead><tr><th>Sl No.</th><th>Name</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {memberProducts.map((product) => <tr key={product.id}>
              <td>
                <input form="member-order-form" type="hidden" name="productId" value={product.id} />
                <input
                  form="member-order-form"
                  className={styles.serialInput}
                  name="sortOrder"
                  type="number"
                  min="-9999"
                  max="9999"
                  defaultValue={product.sortOrder}
                  aria-label={`${product.name} serial number`}
                />
              </td>
              <td>{product.name}</td>
              <td>৳{product.price.toLocaleString("en-BD")}</td>
              <td>{product.status}</td>
              <td>
                <form action={removeProductFromCategoryAction}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <button className={styles.danger} type="submit">Remove</button>
                </form>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </>}

    <h2 style={{ marginTop: 28 }}>Available products{availableProducts.length ? ` (${availableProducts.length})` : ""}</h2>

    {availableProducts.length === 0
      ? <p className={styles.muted}>No other products found{search ? ` for “${search}”` : ""}. Create new products from the Products page.</p>
      : <form action={copyProductsToCategoryAction}>
          <input type="hidden" name="categoryId" value={category.id} />
          <div className={styles.tableWrap} style={{ marginTop: 12 }}>
            <table className={styles.table}>
              <thead><tr><th>Add</th><th>Name</th><th>Current category</th><th>Price</th><th>Status</th></tr></thead>
              <tbody>
                {availableProducts.map((product) => <tr key={product.id}>
                  <td><input type="checkbox" name="productIds" value={product.id} aria-label={`Add ${product.name}`} /></td>
                  <td>{product.name}</td>
                  <td>{product.category.name}</td>
                  <td>৳{product.price.toLocaleString("en-BD")}</td>
                  <td>{product.status}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className={styles.actions}>
            <button className={styles.button} type="submit">Copy selected products</button>
            <Link className={styles.buttonSecondary} href={`/admin/categories/${category.id}/products`}>Reset</Link>
          </div>
        </form>}
  </>;
}