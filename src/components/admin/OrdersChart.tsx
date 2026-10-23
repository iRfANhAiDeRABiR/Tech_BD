"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import styles from "@/app/admin/admin.module.css";

type ChartDataPoint = {
  date: string;
  orders: number;
};

type OrdersChartProps = {
  data: ChartDataPoint[];
};

function CustomTooltip({ active, payload, label, t, formatNumber }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "10px 14px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--text-muted)",
            fontSize: "12px",
            marginBottom: "4px",
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: 0,
            color: "var(--accent-primary)",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          {formatNumber ? formatNumber(payload[0].value) : payload[0].value}{" "}
          {t ? t.chart_tooltip_orders : "Orders"}
        </p>
      </div>
    );
  }
  return null;
}

export function OrdersChart({ data }: OrdersChartProps) {
  const { t, formatNumber } = useAdminLanguage();

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateText}>{t.chart_empty_title}</p>
        <p className={styles.emptyStateSub}>{t.chart_empty_sub}</p>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-color)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip t={t} formatNumber={formatNumber} />} />
          <Area
            type="monotone"
            dataKey="orders"
            stroke="#6C63FF"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorOrders)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
