import Link from "next/link";
import { updateOrderStatusAction } from "../../actions";
import prisma from "@/lib/prisma";
import { formatDisplayIp } from "@/lib/ip-utils";
import styles from "../../admin.module.css";

interface AdminOrdersPageProps {
  searchParams: Promise<{
    q?: string;
    updated?: string;
  }>;
}

const orderStatusOptions = [
  { value: "PENDING_PAYMENT", label: "Pending" },
  { value: "COMPLETED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
] as const;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function formatPrice(amount: number, currency = "BDT") {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const query = await searchParams;
  const search = String(query.q ?? "").trim();
  const orderWhere = search
    ? {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" as const } },
          { customerName: { contains: search, mode: "insensitive" as const } },
          { customerEmail: { contains: search, mode: "insensitive" as const } },
          { customerPhone: { contains: search, mode: "insensitive" as const } },
          { customerWhatsApp: { contains: search, mode: "insensitive" as const } },
          { payment: { is: { transactionId: { contains: search, mode: "insensitive" as const } } } },
          { items: { some: { productName: { contains: search, mode: "insensitive" as const } } } },
          { items: { some: { productOptionName: { contains: search, mode: "insensitive" as const } } } },
        ],
      }
    : undefined;

  const orders = await prisma.order.findMany({
    where: orderWhere,
    include: {
      _count: { select: { items: true } },
      payment: {
        select: {
          method: true,
          status: true,
          transactionId: true,
          amount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <>
    <div className={styles.header}>
      <div>
        <h1>Orders</h1>
        <p className={styles.muted}>All orders received from the website checkout and saved in the Supabase database.</p>
      </div>
      <Link className={styles.buttonSecondary} href="/admin">Back to dashboard</Link>
    </div>

    {query.updated && <p className={styles.notice}>Order status updated successfully.</p>}

    <form className={styles.searchBar} action="/admin/orders">
      <div className={styles.field}>
        <label htmlFor="order-search">Search orders</label>
        <input
          id="order-search"
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Search by order number, customer, phone, email, transaction ID, or product..."
        />
      </div>
      <div className={styles.actions} style={{ margin: 0 }}>
        <button className={styles.button} type="submit">Search</button>
        {search && <Link className={styles.buttonSecondary} href="/admin/orders">Clear</Link>}
      </div>
    </form>

    {search && <p className={styles.muted}>Showing {orders.length} result{orders.length === 1 ? "" : "s"} for “{search}”.</p>}

    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order &amp; Customer</th>
            <th>Received</th>
            <th>Order status</th>
            <th>Payment</th>
            <th>Mark as</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr><td colSpan={6} className={styles.emptyCell}>{search ? "No orders matched your search." : "No website orders have been received yet."}</td></tr>
          ) : orders.map((order) => {
            const ipMatch = order.notes?.match(/\[IP:\s*([^\]]+)\]/i);
            const customerIp = ipMatch ? formatDisplayIp(ipMatch[1]) : null;

            return (
              <tr key={order.id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                  {order.customerName && <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{order.customerName}</div>}
                  {customerIp && (
                    <div style={{ fontSize: "0.74rem", color: "#6366f1", fontFamily: "monospace", marginTop: 2 }}>
                      IP: {customerIp}
                    </div>
                  )}
                </td>
                <td>{formatDateTime(order.createdAt)}</td>
                <td><span className={styles.statusBadge}>{order.status.replace(/_/g, " ")}</span></td>
                <td>{order.payment ? <><span className={styles.statusBadge}>{order.payment.status}</span><br /><span className={styles.tableSubtext}>{order.payment.method} · {order.payment.transactionId}</span></> : <span className={styles.tableSubtext}>No payment</span>}</td>
                <td>
                  <form action={updateOrderStatusAction} className={styles.inlineForm}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="returnTo" value={search ? `/admin/orders?q=${encodeURIComponent(search)}` : "/admin/orders"} />
                    <select className={styles.compactSelect} name="status" defaultValue={order.status} aria-label={`Update status for ${order.orderNumber}`}>
                      {orderStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <button className={styles.buttonSecondary} type="submit">Update</button>
                  </form>
                </td>
                <td><Link className={styles.buttonSecondary} href={`/admin/orders/${order.id}`}>View details</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </>;
}
