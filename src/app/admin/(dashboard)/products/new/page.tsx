import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminCategoryOptions } from "@/lib/admin-categories";
import styles from "../../../admin.module.css";

export default async function NewProductPage() {
  const categories = await getAdminCategoryOptions();

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>Add product</h1>
          <p className={styles.muted}>Create a storefront product and optional license variants.</p>
        </div>
        <Link className={styles.buttonSecondary} href="/admin/products">
          Back
        </Link>
      </div>
      <ProductForm categories={categories} />
    </>
  );
}
