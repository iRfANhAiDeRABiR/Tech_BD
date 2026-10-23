"use client";

import Link from "next/link";
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
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrdersChart } from "@/components/admin/OrdersChart";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import styles from "@/app/admin/admin.module.css";

export type DashboardStats = {
  orders: number;
  paymentSubmittedOrders: number;
  products: number;
  activeProducts: number;
  categories: number;
  options: number;
};

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string | Date;
};

export type ChartDataPoint = {
  date: string;
  orders: number;
};

interface AdminDashboardViewProps {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  chartData: ChartDataPoint[];
}

export function AdminDashboardView({
  stats,
  recentOrders,
  chartData,
}: AdminDashboardViewProps) {
  const { t, formatNumber, formatCurrency, formatDate } = useAdminLanguage();

  const total7DayOrders = chartData.reduce((acc, curr) => acc + curr.orders, 0);

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.dashHeader}>
        <div className={styles.dashHeaderContent}>
          <div className={styles.dashHeaderBadge}>
            <span className={styles.dashHeaderBadgeDot} />
            {t.dash_badge}
          </div>
          <h1 className={styles.dashTitle}>{t.dash_title}</h1>
          <p className={styles.dashSubtitle}>{t.dash_subtitle}</p>
        </div>
        <div className={styles.dashHeaderActions}>
          <Link href="/admin/orders" className={styles.buttonSecondary}>
            <ListOrdered size={16} />
            <span>{t.dash_manage_orders}</span>
          </Link>
          <Link href="/admin/products/new" className={styles.button}>
            <Plus size={16} strokeWidth={2.5} />
            <span>{t.dash_add_product}</span>
          </Link>
        </div>
      </header>

      {/* KPI Stats Grid - 4 Columns */}
      <section className={styles.statsGrid} aria-label="Key Performance Indicators">
        <StatCard
          title={t.kpi_total_orders_title}
          value={formatNumber(stats.orders)}
          icon={ShoppingCart}
          accent="blue"
          subtext={t.kpi_total_orders_sub}
          href="/admin/orders"
        />
        <StatCard
          title={t.kpi_pending_verification_title}
          value={formatNumber(stats.paymentSubmittedOrders)}
          icon={CreditCard}
          accent="orange"
          subtext={
            stats.paymentSubmittedOrders > 0
              ? t.kpi_requires_check
              : t.kpi_all_handled
          }
          badge={
            stats.paymentSubmittedOrders > 0
              ? { text: t.kpi_action_required, variant: "warning" }
              : undefined
          }
          href="/admin/orders?status=PAYMENT_SUBMITTED"
        />
        <StatCard
          title={t.kpi_active_products_title}
          value={formatNumber(stats.activeProducts)}
          icon={Package}
          accent="green"
          subtext={t.kpi_active_products_sub(
            formatNumber(stats.activeProducts),
            formatNumber(stats.products)
          )}
          href="/admin/products"
        />
        <StatCard
          title={t.kpi_categories_title}
          value={formatNumber(stats.categories)}
          icon={Layers}
          accent="purple"
          subtext={t.kpi_categories_sub(formatNumber(stats.options))}
          href="/admin/categories"
        />
      </section>

      {/* Main Content Grid: Chart (68%) + Operations (32%) */}
      <div className={styles.dashGrid}>
        {/* Orders Overview Chart Card */}
        <section className={styles.dashSection}>
          <div className={styles.dashSectionHeader}>
            <div>
              <h2 className={styles.dashSectionTitle}>{t.chart_title}</h2>
              <p className={styles.dashSectionSubtitle}>
                {t.chart_orders_count(formatNumber(total7DayOrders))}
              </p>
            </div>
            <span className={styles.dashPill}>{t.chart_last_7_days}</span>
          </div>

          <div className={styles.chartWrapper}>
            <OrdersChart data={chartData} />
          </div>
        </section>

        {/* Right Operations Column: Quick Actions */}
        <div className={styles.dashSideColumn}>
          <section className={styles.dashSection}>
            <div className={styles.dashSectionHeader}>
              <h2 className={styles.dashSectionTitle}>{t.quick_operations_title}</h2>
            </div>
            <nav className={styles.quickActionsList} aria-label="Quick operations">
              <Link href="/admin/products/new" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <Plus size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>
                    {t.quick_add_product_title}
                  </span>
                  <span className={styles.quickActionSub}>
                    {t.quick_add_product_sub}
                  </span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>

              <Link href="/admin/orders" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <ListOrdered size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>
                    {t.quick_review_orders_title}
                  </span>
                  <span className={styles.quickActionSub}>
                    {t.quick_review_orders_sub}
                  </span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>

              <Link href="/admin/products" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <Box size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>
                    {t.quick_catalog_title}
                  </span>
                  <span className={styles.quickActionSub}>
                    {t.quick_catalog_sub}
                  </span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>

              <Link href="/admin/categories" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <Layers size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>
                    {t.quick_categories_title}
                  </span>
                  <span className={styles.quickActionSub}>
                    {t.quick_categories_sub}
                  </span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>

              <Link href="/admin/downloads" className={styles.quickActionItem}>
                <div className={styles.quickActionIcon}>
                  <DownloadCloud size={16} />
                </div>
                <div className={styles.quickActionInfo}>
                  <span className={styles.quickActionTitle}>
                    {t.quick_downloads_title}
                  </span>
                  <span className={styles.quickActionSub}>
                    {t.quick_downloads_sub}
                  </span>
                </div>
                <ChevronRight size={14} className={styles.quickActionChevron} />
              </Link>
            </nav>
          </section>
        </div>
      </div>

      {/* Recent Orders Section */}
      <section className={styles.dashSection}>
        <div className={styles.dashSectionHeader}>
          <div>
            <h2 className={styles.dashSectionTitle}>{t.recent_orders_title}</h2>
            <p className={styles.dashSectionSubtitle}>
              {t.recent_orders_subtitle}
            </p>
          </div>
          <Link href="/admin/orders" className={styles.dashSectionAction}>
            <span>{t.view_all_orders}</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIconBox}>
              <ShoppingCart size={28} />
            </div>
            <p className={styles.emptyStateText}>{t.no_orders_yet}</p>
            <p className={styles.emptyStateSub}>{t.no_orders_sub}</p>
          </div>
        ) : (
          <div className={styles.ordersTableWrap}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>{t.col_order}</th>
                  <th>{t.col_customer}</th>
                  <th>{t.col_total}</th>
                  <th>{t.col_status}</th>
                  <th>{t.col_date}</th>
                  <th style={{ textAlign: "right" }}>{t.col_action}</th>
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
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className={styles.rowActionBtn}
                        title="View order details"
                      >
                        <span>{t.btn_details}</span>
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

