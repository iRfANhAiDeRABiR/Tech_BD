import Link from "next/link";
import styles from "./product.module.css";

export default function ProductNotFound() {
  return (
    <main className={styles.page}>
      <div className="container">
        <section className={styles.empty}>
          <span className="section-tag">404</span>

          <h1>Product not found</h1>

          <p>
            The requested product does not exist or is no longer available.
          </p>

          <Link href="/products#products-by-category" className="btn btn--primary btn--lg">
            Browse Products
          </Link>
        </section>
      </div>
    </main>
  );
}