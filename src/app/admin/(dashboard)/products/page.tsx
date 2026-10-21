import Link from "next/link";
import prisma from "@/lib/prisma";
import { deleteProductAction } from "../../actions";
import { ProductImportExport } from "@/components/admin/ProductImportExport";
import styles from "../../admin.module.css";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const [products, query] = await Promise.all([
    prisma.product.findMany({ include: { category: true, _count: { select: { options: true } } }, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] }), searchParams,
  ]);
  return <>
    <div className={styles.header}>
      <div>
        <h1>Products</h1>
        <p className={styles.muted}>Create, edit, archive, and remove catalog items.</p>
      </div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <ProductImportExport />
        <Link className={styles.button} href="/admin/products/new">Add product</Link>
      </div>
    </div>
    {(query.saved || query.deleted) && <p className={styles.notice}>Product catalog updated successfully.</p>}
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Options</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.category.name}</td><td>৳{product.price.toLocaleString("en-BD")}</td><td>{product._count.options}</td><td>{product.status}</td><td><div className={styles.actions} style={{ margin: 0 }}><Link className={styles.buttonSecondary} href={`/admin/products/${product.id}/edit`}>Edit</Link><form action={deleteProductAction}><input type="hidden" name="productId" value={product.id} /><button className={styles.danger} type="submit">Delete</button></form></div></td></tr>)}
    </tbody></table></div>
  </>;
}
