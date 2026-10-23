import prisma from "@/lib/prisma";
import {
  AdminDashboardView,
  type DashboardStats,
  type RecentOrder,
  type ChartDataPoint,
} from "@/components/admin/AdminDashboardView";

const emptyStats: DashboardStats = {
  orders: 0,
  paymentSubmittedOrders: 0,
  products: 0,
  activeProducts: 0,
  categories: 0,
  options: 0,
};

function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
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
      WITH order_counts AS (
        SELECT
          COUNT(*)::int AS orders,
          COUNT(*) FILTER (WHERE status = 'PAYMENT_SUBMITTED')::int AS payment_submitted_orders
        FROM "Order"
      ),
      product_counts AS (
        SELECT
          COUNT(*)::int AS products,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_products
        FROM "Product"
      ),
      category_counts AS (
        SELECT COUNT(*)::int AS categories FROM "Category"
      ),
      option_counts AS (
        SELECT COUNT(*)::int AS options FROM "ProductOption"
      )
      SELECT
        o.orders,
        o.payment_submitted_orders,
        p.products,
        p.active_products,
        c.categories,
        opt.options
      FROM order_counts o, product_counts p, category_counts c, option_counts opt;
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
  const orders = await prisma.order.findMany({
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

  return orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));
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

export default async function AdminDashboard() {
  const [stats, recentOrders, chartData] = await Promise.all([
    getDashboardStats().catch(() => emptyStats),
    getRecentOrders().catch(() => []),
    getOrderChartData().catch(() => []),
  ]);

  return (
    <AdminDashboardView
      stats={stats}
      recentOrders={recentOrders}
      chartData={chartData}
    />
  );
}
