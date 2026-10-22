import Link from "next/link";
import prisma from "@/lib/prisma";
import styles from "../admin.module.css";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrdersChart } from "@/components/admin/OrdersChart";
import {
  ShoppingCart,
  CreditCard,
  Package,
  Layers,
  Plus,
  ListOrdered,
  Box,
  DownloadCloud,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Activity,
} from "lucide-react";

// --- Types ---

type DashboardStats = {
  orders: number;
  paymentSubmittedOrders: number;
  products: number;
  activeProducts: number;
  categories: number;
  options: number;
};

type DatabaseHealth = {
  ok: boolean;
  condition: string;
  responseTimeMs: number | null;
  databaseName: string;
  schemaName: string;
  serverTime: string;
  version: string;
  host: string;
  error?: string;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: Date;
};

type ChartDataPoint = {
  date: string;
  orders: number;
};

// --- Helpers ---

const emptyStats: DashboardStats = {
  orders: 0,
  paymentSubmittedOrders: 0,
  products: 0,
  activeProducts: 0,
  categories: 0,
  options: 0,
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDatabaseHost() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return "Not configured";
  try {
    const url = new URL(connectionString);
    return url.host;
  } catch {
    return "Configured";
  }
}

// --- Data Fetching ---

async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const startedAt = performance.now();
  const host = getDatabaseHost();

  try {
    const detailsPromise = prisma.$queryRaw<
      {
        database_name: string;
        schema_name: string;
        server_time: Date;
        version: string;
      }[]
    >`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        now() AS server_time,
        version() AS version
    `;

    const [row] = await detailsPromise;
    const responseTimeMs = Math.round(performance.now() - startedAt);

    return {
      ok: true,
      condition: responseTimeMs < 500 ? "Healthy" : "Slow response",
      responseTimeMs,
      databaseName: row?.database_name ?? "Unknown",
      schemaName: row?.schema_name ?? "Unknown",
      serverTime: row?.server_time ? formatDateTime(row.server_time) : "Unknown",
      version: row?.version ?? "PostgreSQL",
      host,
    };
  } catch (error) {
    return {
      ok: false,
      condition: "Connection error",
      responseTimeMs: null,
      databaseName: "Unavailable",
      schemaName: "Unavailable",
      serverTime: "Unavailable",
      version: "Unavailable",
      host,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [stats] = await prisma.$queryRaw<
      {
        orders: number;
        payment_submitted_orders: number;
        products: number;
        active_products: number;
        categories: number;
        options: number;
      }[]
    >`
      SELECT
        (SELECT COUNT(*)::int FROM "Order") AS orders,
        (SELECT COUNT(*)::int FROM "Order" WHERE status = 'PAYMENT_SUBMITTED') AS payment_submitted_orders,
        (SELECT COUNT(*)::int FROM "Product") AS products,
        (SELECT COUNT(*)::int FROM "Product" WHERE status = 'ACTIVE') AS active_products,
        (SELECT COUNT(*)::int FROM "Category") AS categories,
        (SELECT COUNT(*)::int FROM "ProductOption") AS options
    `;

    return {
      orders: Number(stats?.orders ?? 0),
      paymentSubmittedOrders: Number(stats?.payment_submitted_orders ?? 0),
      products: Number(stats?.products ?? 0),
      activeProducts: Number(stats?.active_products ?? 0),
      categories: Number(stats?.categories ?? 0),
      options: Number(stats?.options ?? 0),
    };
  } catch (error) {
    console.warn("Could not load dashboard stats:", error);
    return emptyStats;
  }
}

async function getRecentOrders(): Promise<RecentOrder[]> {
  return prisma.order.findMany({
    take: 7,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });
}

async function getOrderChartData(): Promise<ChartDataPoint[]> {
  try {
    const result = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT
        TO_CHAR(DATE("createdAt"), 'Mon DD') AS date,
        COUNT(*)::bigint AS count
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(formatDateShort(d));
    }

    const dataMap = new Map(result.map((r) => [r.date, Number(r.count)]));

    return days.map((date) => ({
      date,
      orders: dataMap.get(date) || 0,
    }));
  } catch (err) {
    console.warn("Could not load order chart data:", err);
    return [];
  }
}

// --- Component ---

export default async function AdminDashboard() {
  const [databaseHealth, statsResult, recentOrders, chartData] =
    await Promise.all([
      getDatabaseHealth(),
      getDashboardStats().catch(() => emptyStats),
      getRecentOrders().catch(() => []),
      getOrderChartData().catch(() => []),
    ]);

  const stats = databaseHealth.ok ? statsResult : emptyStats;
  const total7DayOrders = chartData.reduce((acc, curr) => acc + curr.orders, 0);

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.dashHeader}>
        <div className={styles.dashHeaderContent}>
          <div className={styles.dashHeaderBadge}>
            <span className={styles.dashHeaderBadgeDot} />
            Store Management
          </div>
          <h1 className={styles.dashTitle}>Store Overview</h1>
          <p className={styles.dashSubtitle}>
            Real-time performance, order stream, and catalog status.
          </p>
        </div>
        <div className={styles.dashHeaderActions}>
          <Link href="/admin/orders" className={styles.buttonSecondary}>
            <ListOrdered size={16} />
            <span>Manage Orders</span>
          </Link>
          <Link href="/admin/products/new" className={styles.button}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Product</span>
          </Link>
        </div>
      </header>

      {/* KPI Stats Grid - Balanced 4 Columns */}
      <section className={styles.statsGrid} aria-label="Key Performance Indicators">
        <StatCard
          title="Total Orders"
          value={stats.orders}
          icon={ShoppingCart}
          accent="blue"
          subtext="Lifetime customer purchases"
          href="/admin/orders"
        />
        <StatCard
          title="Pending Verification"
          value={stats.paymentSubmittedOrders}
          icon={CreditCard}
          accent="orange"
          subtext={
            stats.paymentSubmittedOrders > 0
              ? "Requires payment check"
              : "All submitted payments handled"
          }
          badge={
            stats.paymentSubmittedOrders > 0
              ? { text: "Action required", variant: "warning" }
              : undefined
          }
          href="/admin/orders?status=PAYMENT_SUBMITTED"
        />
        <StatCard
          title="Active Products"
          value={stats.activeProducts}
          icon={Package}
          accent="green"
          subtext={`Out of ${stats.products} total products`}
          href="/admin/products"
        />
        <StatCard
          title="Categories & Options"
          value={stats.categories}
          icon={Layers}
          accent="purple"
          subtext={`${stats.options} license pricing options`}
          href="/admin/categories"
        />
      </section>

      {/* Main Content Grid: Chart (68%) + Operations & Health (32%) */}
      <div className={styles.dashGrid}>
        {/* Orders Overview Chart Card */}
        <section className={styles.dashSection}>
          <div className={styles.dashSectionHeader}>
            <div>
              <h2 className={styles.dashSectionTitle}>Orders Volume</h2>
              <p className={styles.dashSectionSubtitle}>
                {total7DayOrders} {total7DayOrders === 1 ? "order" : "orders"} placed in the past 7 days
              </p>
            </div>
            <span className={styles.dashPill}>Last 7 Days</span>
          </div>

          <div className={styles.chartWrapper}>
            <OrdersChart data={chartData} />
          </div>
        </section>

        {/* Right Operations Column: Quick Actions + System Health */}
        <div className={styles.dashSideColumn}>
          {/* Quick Actions Card */}
          <section className={styles.dashSection}>
            <div className={styles.dashSectionHeader}>
              <h2 className={styles.dashSectionTitle}>Quick Operations</h2>
            </div>
            <nav className={styles.quickActionsList} aria-label="Quick operations">
              <Link href="/admin/products/new" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <Plus size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>Add Product</span>
                  <span className={styles.quickActionSub}>Create new license entry</span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>

              <Link href="/admin/orders" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <ListOrdered size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>Review Orders</span>
                  <span className={styles.quickActionSub}>Process & deliver keys</span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>

              <Link href="/admin/products" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <Box size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>Product Catalog</span>
                  <span className={styles.quickActionSub}>Manage pricing & stock</span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>

              <Link href="/admin/categories" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <Layers size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>Categories</span>
                  <span className={styles.quickActionSub}>Organize store groups</span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>

              <Link href="/admin/downloads" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <DownloadCloud size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>Downloads</span>
                  <span className={styles.quickActionSub}>Installer mirror links</span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>
            </nav>
          </section>

          {/* System Health Card */}
          <section className={styles.dashSection}>
            <div className={styles.dashSectionHeader}>
              <div className={styles.healthTitleRow}>
                <Activity size={16} className={styles.healthIcon} />
                <h2 className={styles.dashSectionTitle}>System Health</h2>
              </div>
              <StatusBadge status={databaseHealth.ok ? "ONLINE" : "ERROR"} />
            </div>

            <div className={styles.healthCompact}>
              <div className={styles.healthRow}>
                <span className={styles.healthLabel}>Database Engine</span>
                <span className={styles.healthValue}>
                  {databaseHealth.ok ? "PostgreSQL (Connected)" : "Offline"}
                </span>
              </div>
              <div className={styles.healthRow}>
                <span className={styles.healthLabel}>Query Latency</span>
                <span className={styles.healthValue}>
                  {databaseHealth.responseTimeMs !== null ? (
                    <span className={styles.latencyGood}>
                      <span className={styles.latencyDot} />
                      {databaseHealth.responseTimeMs} ms
                    </span>
                  ) : (
                    "Failed"
                  )}
                </span>
              </div>
              <div className={styles.healthRow}>
                <span className={styles.healthLabel}>Timezone</span>
                <span className={styles.healthValue}>Asia/Dhaka</span>
              </div>

              <Link
                href="/admin/system"
                className={styles.quickActionLink}
                style={{
                  marginTop: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  color: "#818cf8",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textDecoration: "none",
                }}
              >
                <span>Open System Diagnostics</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Recent Orders Section */}
      <section className={styles.dashSection}>
        <div className={styles.dashSectionHeader}>
          <div>
            <h2 className={styles.dashSectionTitle}>Recent Orders</h2>
            <p className={styles.dashSectionSubtitle}>
              Latest customer purchases and order fulfillment requests
            </p>
          </div>
          <Link href="/admin/orders" className={styles.dashSectionAction}>
            <span>View All Orders</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIconBox}>
              <ShoppingCart size={28} />
            </div>
            <p className={styles.emptyStateText}>No orders received yet</p>
            <p className={styles.emptyStateSub}>
              When customers complete checkout, their orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className={styles.ordersTableWrap}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Placed Date</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className={styles.orderIdLink}
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <span className={styles.customerNameCell}>
                        {order.customerName}
                      </span>
                    </td>
                    <td>
                      <span className={styles.amountCell}>
                        {formatCurrency(order.total)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      <span className={styles.dateCell}>
                        {formatDateShort(order.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className={styles.rowActionBtn}
                        title="View order details"
                      >
                        <span>Details</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
