import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AdminToastListener } from "@/components/admin/AdminToastListener";
import { logoutAction } from "../actions";
import styles from "../admin.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return <div className={styles.shell}>
    <Suspense fallback={null}>
      <AdminToastListener />
    </Suspense>
    <nav className={styles.nav}>
      <Link className={styles.brand} href="/admin">Tech BD Admin</Link>
      <Link href="/admin/orders">Orders</Link>
      <Link href="/admin/products">Products</Link>
      <Link href="/admin/categories">Categories</Link>
      <Link href="/admin/downloads">Downloads</Link>
      <Link href="/" target="_blank">Storefront ↗</Link>
      <ThemeToggle />
      <form action={logoutAction}><button className={styles.logout}>Sign out</button></form>
    </nav>
    <main className={styles.main}>{children}</main>
  </div>;
}