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

  const isTopSelling = category.id === 17 || category.slug.toLowerCase() === "top-selling";

  const search = (query.q ?? "").trim();
  const searchWhere = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const products = await prisma.product.findMany({
    where: searchWhere,
    include: { category: { select: { name: true } } },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  const memberProducts = isTopSelling
    ? await prisma.product.findMany({
        where: {
          isFeatured: true,
          status: "ACTIVE",
          ...(searchWhere ?? {}),
        },
        include: { category: { select: { name: true } } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
    : await prisma.product.findMany({
        where: { categoryId },
        include: { category: { select: { name: true } } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

  const memberIds = new Set(memberProducts.map((p) => p.id));
  const availableProducts = isTopSelling
    ? products.filter((product) => !memberIds.has(product.id) && product.status === "ACTIVE")
    : products.filter((product) => product.categoryId !== categoryId);

  return <>
    <div className={styles.header}>
      <div>
        <h1>{isTopSelling ? `Manage “${category.name}” Products` : `Add products to “${category.name}”`}</h1>
        <p className={styles.muted}>
          {isTopSelling
            ? "Feature genuine store products here. Selected products appear in Top Selling without creating duplicate product listings."
            : "Select existing products below to copy them into this category. The originals stay in their current category."}
        </p>
      </div>
      <Link className={styles.buttonSecondary} href="/admin/categories">Back</Link>
    </div>

    {query.added === "1" && (
      <p className={styles.notice}>
        {isTopSelling ? `Products featured in “${category.name}”.` : `Products copied to “${category.name}”.`}
      </p>
    )}
    {query.added === "0" && <p className={styles.notice}>No products were selected.</p>}
    {query.ordered === "1" && <p className={styles.notice}>Product order updated.</p>}
    {query.removed === "1" && (
      <p className={styles.notice}>
        {isTopSelling ? `Product unfeatured from “${category.name}”.` : `Product removed from “${category.name}”.`}
      </p>
    )}

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
          <h2>{isTopSelling ? `Featured in Top Selling (${memberProducts.length})` : `Already in this category (${memberProducts.length})`}</h2>
          <p className={styles.muted}>Lower serial numbers show first on the website.</p>
        </div>
        <form id="member-order-form" action={saveCategoryProductOrderAction}>
          <input type="hidden" name="categoryId" value={category.id} />
        </form>
        <button form="member-order-form" className={styles.button} type="submit">Save order</button>
      </div>
      <div className={styles.tableWrap} style={{ marginTop: 12 }}>
        <table className={styles.table}>
          <thead><tr><th>Sl No.</th><th>Name</th><th>Original Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
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
              <td>{product.category?.name ?? "-"}</td>
              <td>৳{product.price.toLocaleString("en-BD")}</td>
              <td>{product.status}</td>
              <td>
                <form action={removeProductFromCategoryAction}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <button className={styles.danger} type="submit">
                    {isTopSelling ? "Unfeature" : "Remove"}
                  </button>
                </form>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </>}

    <h2 style={{ marginTop: 28 }}>
      {isTopSelling ? "Available products to feature" : "Available products"}
      {availableProducts.length ? ` (${availableProducts.length})` : ""}
    </h2>

    {availableProducts.length === 0
      ? <p className={styles.muted}>No other products found{search ? ` for “${search}”` : ""}. Create new products from the Products page.</p>
      : <form action={copyProductsToCategoryAction}>
          <input type="hidden" name="categoryId" value={category.id} />
          <div className={styles.tableWrap} style={{ marginTop: 12 }}>
            <table className={styles.table}>
              <thead><tr><th>{isTopSelling ? "Feature" : "Add"}</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th></tr></thead>
              <tbody>
                {availableProducts.map((product) => <tr key={product.id}>
                  <td><input type="checkbox" name="productIds" value={product.id} aria-label={`Select ${product.name}`} /></td>
                  <td>{product.name}</td>
                  <td>{product.category.name}</td>
                  <td>৳{product.price.toLocaleString("en-BD")}</td>
                  <td>{product.status}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className={styles.actions}>
            <button className={styles.button} type="submit">
              {isTopSelling ? "Feature selected products in Top Selling" : "Copy selected products"}
            </button>
            <Link className={styles.buttonSecondary} href={`/admin/categories/${category.id}/products`}>Reset</Link>
          </div>
        </form>}
  </>;
}
