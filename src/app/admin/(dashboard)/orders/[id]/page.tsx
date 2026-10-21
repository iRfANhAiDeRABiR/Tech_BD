import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatusAction } from "../../../actions";
import prisma from "@/lib/prisma";
import styles from "../../../admin.module.css";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
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

export default async function AdminOrderDetailPage({ params, searchParams }: AdminOrderDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      payment: {
        include: {
          verifiedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  return <>
    <div className={styles.header}>
      <div>
        <h1>{order.orderNumber}</h1>
        <p className={styles.muted}>Full website order details received from Supabase database.</p>
      </div>
      <div className={styles.actions} style={{ margin: 0 }}>
        <Link className={styles.buttonSecondary} href="/admin/orders">Back to orders</Link>
      </div>
    </div>

    {query.updated && <p className={styles.notice}>Order status updated successfully.</p>}

    <section className={styles.cards}>
      <div className={styles.card}>Order status<strong>{order.status.replace(/_/g, " ")}</strong></div>
      <div className={styles.card}>Payment status<strong>{order.payment?.status ?? "No payment"}</strong></div>
      <div className={styles.card}>Total<strong>{formatPrice(order.total, order.currency)}</strong></div>
      <div className={styles.card}>Received<strong>{formatDateTime(order.createdAt)}</strong></div>
    </section>

    <section className={styles.panel} style={{ marginTop: 22 }}>
      <h2>Update order status</h2>
      <form action={updateOrderStatusAction} className={styles.inlineForm}>
        <input type="hidden" name="orderId" value={order.id} />
        <input type="hidden" name="returnTo" value={`/admin/orders/${order.id}`} />
        <select className={styles.compactSelect} name="status" defaultValue={order.status} aria-label="Update order status">
          {orderStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button className={styles.button} type="submit">Update status</button>
      </form>
      <p className={styles.muted}>Delivered is saved as COMPLETED in the database.</p>
    </section>

    <section className={styles.detailGrid}>
      <div className={styles.panel}>
        <h2>Customer details</h2>
        <dl className={styles.metaList}>
          <div><dt>Name</dt><dd>{order.customerName}</dd></div>
          <div><dt>Phone</dt><dd><a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a></dd></div>
          <div><dt>WhatsApp</dt><dd>{order.customerWhatsApp ? <a href={`https://wa.me/${order.customerWhatsApp.replace(/\D/g, "")}`} target="_blank">{order.customerWhatsApp}</a> : "Not provided"}</dd></div>
          <div><dt>Email</dt><dd>{order.customerEmail ? <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a> : "Not provided"}</dd></div>
          <div><dt>Customer notes</dt><dd>{order.notes ?? "No notes"}</dd></div>
        </dl>
      </div>

      <div className={styles.panel}>
        <h2>Payment details</h2>
        {order.payment ? (
          <dl className={styles.metaList}>
            <div><dt>Method</dt><dd>{order.payment.method}</dd></div>
            <div><dt>Status</dt><dd><span className={styles.statusBadge}>{order.payment.status}</span></dd></div>
            <div><dt>Transaction ID</dt><dd>{order.payment.transactionId}</dd></div>
            <div><dt>Sender number</dt><dd>{order.payment.senderNumber ?? "Not provided"}</dd></div>
            <div><dt>Payment number</dt><dd>{order.payment.paymentNumber ?? "Not provided"}</dd></div>
            <div><dt>Submitted amount</dt><dd>{formatPrice(order.payment.amount, order.currency)}</dd></div>
            <div><dt>Submitted at</dt><dd>{formatDateTime(order.payment.submittedAt)}</dd></div>
            <div><dt>Verified by</dt><dd>{order.payment.verifiedBy ? `${order.payment.verifiedBy.name ?? "Admin"} (${order.payment.verifiedBy.email})` : "Not verified"}</dd></div>
            <div><dt>Verified at</dt><dd>{order.payment.verifiedAt ? formatDateTime(order.payment.verifiedAt) : "Not verified"}</dd></div>
            <div><dt>Payment notes</dt><dd>{order.payment.notes ?? "No notes"}</dd></div>
            <div><dt>Proof image</dt><dd>{order.payment.proofImageUrl ? <a href={order.payment.proofImageUrl} target="_blank">Open proof image</a> : "No proof uploaded"}</dd></div>
          </dl>
        ) : <p className={styles.muted}>No payment submission is linked with this order.</p>}
      </div>
    </section>

    <section className={styles.panel}>
      <div className={styles.orderHeader}>
        <div>
          <h2>Purchased items</h2>
          <p className={styles.muted}>Products and license options submitted during checkout.</p>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Option</th>
              <th>Type</th>
              <th>Unit price</th>
              <th>Qty</th>
              <th>Line total</th>
              <th>Catalog</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.productName}</strong></td>
                <td>{item.productOptionName ?? "Default"}</td>
                <td>{item.productOptionType ?? "-"}</td>
                <td>{formatPrice(item.unitPrice, order.currency)}{item.originalUnitPrice ? <><br /><span className={styles.tableSubtext}>Original: {formatPrice(item.originalUnitPrice, order.currency)}</span></> : null}</td>
                <td>{item.quantity}</td>
                <td>{formatPrice(item.lineTotal, order.currency)}</td>
                <td>{item.product ? <Link className={styles.buttonSecondary} href={`/admin/products/${item.product.id}/edit`}>View product</Link> : <span className={styles.tableSubtext}>Deleted product</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <section className={styles.summaryPanel}>
      <h2>Order summary</h2>
      <div className={styles.summaryRow}><span>Subtotal</span><strong>{formatPrice(order.subtotal, order.currency)}</strong></div>
      <div className={styles.summaryRow}><span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span><strong>-{formatPrice(order.discount, order.currency)}</strong></div>
      <div className={styles.summaryTotal}><span>Total</span><strong>{formatPrice(order.total, order.currency)}</strong></div>
      <div className={styles.summaryRow}><span>Created</span><span>{formatDateTime(order.createdAt)}</span></div>
      <div className={styles.summaryRow}><span>Last updated</span><span>{formatDateTime(order.updatedAt)}</span></div>
    </section>
  </>;
}