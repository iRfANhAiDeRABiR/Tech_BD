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
  BadgeCheck,
  Layers,
  KeyRound,
  Plus,
  ListOrdered,
  Box,
  Settings,
  Database,
  Activity,
  ChevronDown,
  ChevronUp,
  DownloadCloud,
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
  return new Intl.NumberFormat("bn-BD", {
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

    await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    const responseTimeMs = Math.round(performance.now() - startedAt);
    const [row] = await detailsPromise;

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
  const [orders, paymentSubmittedOrders, products, activeProducts, categories, options] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PAYMENT_SUBMITTED" } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.category.count(),
      prisma.productOption.count(),
    ]);

  return { orders, paymentSubmittedOrders, products, activeProducts, categories, options };
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
  // Get order counts for the last 7 days
  const result = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT
      TO_CHAR(DATE(created_at), 'Mon DD') AS date,
      COUNT(*)::bigint AS count
    FROM "Order"
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;

  // Fill in missing days with 0 if necessary, though raw query might skip them
  // For simplicity in this redesign, we map what we get.
  // Ideally we'd generate a full 7-day range in JS and merge.
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
}

// --- Component ---

export default async function AdminDashboard() {
  const [databaseHealth, statsResult, recentOrders, chartData] = await Promise.all([
    getDatabaseHealth(),
    getDashboardStats().catch(() => emptyStats),
    getRecentOrders().catch(() => []),
    getOrderChartData().catch(() => []),
  ]);

  const stats = databaseHealth.ok ? statsResult : emptyStats;

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.dashHeader}>
        <div className={styles.dashHeaderContent}>
          <h1>Dashboard</h1>
          <p className={styles.dashHeaderSubtitle}>
            Welcome back. Here's what's happening with your store today.
          </p>
        </div>
        <div className={styles.dashHeaderActions}>
          <Link href="/admin/orders" className={styles.buttonSecondary}>
            View Orders
          </Link>
          <Link href="/admin/products/new" className={styles.button}>
            <Plus size={18} strokeWidth={2.5} style={{ marginRight: 6 }} />
            Add Product
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <section className={styles.statsGrid}>
        <StatCard
          title="Total Orders"
          value={stats.orders}
          icon={ShoppingCart}
          accent="blue"
          href="/admin/orders"
        />
        <StatCard
          title="Payments Submitted"
          value={stats.paymentSubmittedOrders}
          icon={CreditCard}
          accent="green"
          href="/admin/orders?status=PAYMENT_SUBMITTED"
        />
        <StatCard
          title="All Products"
          value={stats.products}
          icon={Package}
          accent="purple"
          href="/admin/products"
        />
        <StatCard
          title="Active Products"
          value={stats.activeProducts}
          icon={BadgeCheck}
          accent="cyan"
          href="/admin/products?status=ACTIVE"
        />
        <StatCard
          title="Categories"
          value={stats.categories}
          icon={Layers}
          accent="orange"
          href="/admin/categories"
        />
        <StatCard
          title="License Options"
          value={stats.options}
          icon={KeyRound}
          accent="pink"
          href="/admin/options"
        />
      </section>

      {/* Main Content Grid: Chart + Quick Actions */}
      <div className={styles.dashGrid}>
        {/* Orders Overview Chart */}
        <section className={styles.dashSection}>
          <div className={styles.dashSectionHeader}>
            <h2 className={styles.dashSectionTitle}>Orders Overview</h2>
            <span className={styles.muted} style={{ fontSize: 13 }}>Last 7 Days</span>
          </div>
          <OrdersChart data={chartData} />
        </section>

        {/* Quick Actions & System Health Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Quick Actions */}
          <section className={styles.dashSection}>
            <div className={styles.dashSectionHeader}>
              <h2 className={styles.dashSectionTitle}>Quick Actions</h2>
            </div>
            <nav className={styles.quickActionsList}>
              <Link href="/admin/products/new" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}><Plus size={16} /></div>
                Add New Product
              </Link>
              <Link href="/admin/orders" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}><ListOrdered size={16} /></div>
                Manage Orders
              </Link>
              <Link href="/admin/products" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}><Box size={16} /></div>
                Manage Products
              </Link>
              <Link href="/admin/categories" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}><Layers size={16} /></div>
                Categories
              </Link>
              <Link href="/admin/downloads" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}><DownloadCloud size={16} /></div>
                Software Downloads
              </Link>
            </nav>
          </section>

          {/* System Health Compact */}
          <section className={styles.dashSection}>
            <div className={styles.dashSectionHeader}>
              <h2 className={styles.dashSectionTitle}>System Health</h2>
              <StatusBadge status={databaseHealth.ok ? "HEALTHY" : "ERROR"} />
            </div>
            <div className={styles.healthCompact}>
              <div className={styles.healthRow}>
                <span className={styles.healthLabel}>Database</span>
                <span className={styles.healthValue}>{databaseHealth.ok ? "Online" : "Offline"}</span>
              </div>
              <div className={styles.healthRow}>
                <span className={styles.healthLabel}>Response Time</span>
                <span className={styles.healthValue}>
                  {databaseHealth.responseTimeMs !== null ? `${databaseHealth.responseTimeMs} ms` : "Failed"}
                </span>
              </div>
              <div className={styles.healthRow}>
                <span className={styles.healthLabel}>Engine</span>
                <span className={styles.healthValue}>PostgreSQL</span>
              </div>
              
              {/* Technical Details Toggle (Client-side interaction would be ideal, but using <details> for SSR simplicity) */}
              <details style={{ marginTop: 8 }}>
                <summary className={styles.techDetailsToggle}>
                  Technical Details <ChevronDown size={12} />
                </summary>
                <div className={styles.techDetailsContent}>
                  <div><strong>Host:</strong> {databaseHealth.host}</div>
                  <div><strong>Database:</strong> {databaseHealth.databaseName}</div>
                  <div><strong>Schema:</strong> {databaseHealth.schemaName}</div>
                  <div><strong>Server Time:</strong> {databaseHealth.serverTime}</div>
                  <div style={{ marginTop: 8, wordBreak: "break-word", opacity: 0.7, fontSize: 11 }}>
                    {databaseHealth.version}
                  </div>
                  {databaseHealth.error && (
                    <div style={{ color: "#f87171", marginTop: 8 }}>{databaseHealth.error}</div>
                  )}
                </div>
              </details>
            </div>
          </section>
        </div>
      </div>

      {/* Recent Orders Section */}
      <section className={styles.dashSection} style={{ marginBottom: 40 }}>
        <div className={styles.dashSectionHeader}>
          <h2 className={styles.dashSectionTitle}>Recent Orders</h2>
          <Link href="/admin/orders" className={styles.dashSectionAction}>
            View All &rarr;
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingCart className={styles.emptyStateIcon} />
            <p className={styles.emptyStateText}>No orders yet</p>
            <p className={styles.emptyStateSub}>Orders will appear here when customers place them.</p>
          </div>
        ) : (
          <div className={styles.ordersTableWrap}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className={styles.orderIdLink}>
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td>{order.customerName}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {formatDateShort(order.createdAt)}
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