"use client";

import { useState } from "react";
import {
  Activity,
  Database,
  Mail,
  Send,
  Cloud,
  Server,
  RefreshCw,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShoppingBag,
} from "lucide-react";
import type { SystemTelemetry } from "@/lib/diagnostics";
import styles from "./SystemHealthView.module.css";

interface SystemHealthViewProps {
  initialTelemetry: SystemTelemetry;
}

export function SystemHealthView({ initialTelemetry }: SystemHealthViewProps) {
  const [telemetry, setTelemetry] = useState<SystemTelemetry>(initialTelemetry);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastPingLatency, setLastPingLatency] = useState<number | null>(null);

  const handleRefreshDiagnostics = async () => {
    setIsRefreshing(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/admin/diagnostics", { cache: "no-store" });
      if (res.ok) {
        const data: SystemTelemetry = await res.json();
        setTelemetry(data);
        setLastPingLatency(Math.round(performance.now() - start));
      }
    } catch (err) {
      console.error("Live diagnostics ping failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const { database, email, telegram, cloudinary, server, stats, apiEndpoints } = telemetry;

  return (
    <div className={styles.container}>
      {/* ─────────────────────────────────────────────────────────────
         TOP HEADER BANNER
         ───────────────────────────────────────────────────────────── */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox}>
            <Activity size={26} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>System Health & Diagnostics</h1>
            <p className={styles.headerSubtitle}>
              Live infrastructure telemetry, subsystem connectivity, and runtime metrics.
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
              Last checked: {telemetry.timestamp}
            </span>
            {lastPingLatency !== null && (
              <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>
                Live Ping: {lastPingLatency}ms
              </span>
            )}
          </div>
          <button
            type="button"
            className={styles.btnPing}
            onClick={handleRefreshDiagnostics}
            disabled={isRefreshing}
          >
            <RefreshCw
              size={15}
              style={{
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>{isRefreshing ? "Pinging..." : "Run Live Diagnostics"}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
         KEY METRICS GRID
         ───────────────────────────────────────────────────────────── */}
      <div className={styles.metricsGrid}>
        {/* DB Latency */}
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Database Latency</span>
            <span className={styles.metricValue}>
              {database.responseTimeMs !== null ? `${database.responseTimeMs} ms` : "Offline"}
            </span>
            <span className={styles.metricSub}>
              {database.ok ? `Condition: ${database.condition}` : "Connection Failed"}
            </span>
          </div>
          <div
            className={styles.metricIcon}
            style={{
              background: database.ok ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              color: database.ok ? "#34d399" : "#f87171",
            }}
          >
            <Database size={22} />
          </div>
        </div>

        {/* Server Memory */}
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Heap Memory</span>
            <span className={styles.metricValue}>
              {server.memory.heapUsedMb} MB
            </span>
            <span className={styles.metricSub}>
              Total: {server.memory.heapTotalMb} MB ({server.memory.heapUsedPercent}%)
            </span>
          </div>
          <div
            className={styles.metricIcon}
            style={{
              background: "rgba(99, 102, 241, 0.12)",
              color: "#818cf8",
            }}
          >
            <HardDrive size={22} />
          </div>
        </div>

        {/* Server Uptime */}
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Process Uptime</span>
            <span className={styles.metricValue}>{server.uptimeFormatted}</span>
            <span className={styles.metricSub}>Node {server.nodeVersion} ({server.platform})</span>
          </div>
          <div
            className={styles.metricIcon}
            style={{
              background: "rgba(14, 165, 233, 0.12)",
              color: "#38bdf8",
            }}
          >
            <Clock size={22} />
          </div>
        </div>

        {/* Telegram Orders Alert */}
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Telegram Bot</span>
            <span className={styles.metricValue}>
              {telegram.configured ? "Connected" : "Not Set"}
            </span>
            <span className={styles.metricSub}>
              Admin ID: {telegram.adminChatId}
            </span>
          </div>
          <div
            className={styles.metricIcon}
            style={{
              background: telegram.configured ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
              color: telegram.configured ? "#34d399" : "#fbbf24",
            }}
          >
            <Send size={20} />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
         SERVICES & SUBSYSTEMS DETAILS GRID
         ───────────────────────────────────────────────────────────── */}
      <div className={styles.servicesGrid}>
        {/* PostgreSQL Database Subsystem */}
        <div className={styles.serviceCard}>
          <div className={styles.serviceHeader}>
            <div className={styles.serviceHeaderLeft}>
              <div
                className={styles.serviceIconBox}
                style={{
                  background: "rgba(59, 130, 246, 0.12)",
                  color: "#60a5fa",
                }}
              >
                <Database size={20} />
              </div>
              <div>
                <h2 className={styles.serviceTitle}>PostgreSQL Database</h2>
                <p className={styles.serviceSub}>Neon Cloud Serverless Driver</p>
              </div>
            </div>
            <div className={database.ok ? styles.statusPillOnline : styles.statusPillError}>
              <span className={styles.statusDot} />
              {database.ok ? "ONLINE" : "ERROR"}
            </div>
          </div>

          <div className={styles.kvTable}>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Host Endpoint</span>
              <span className={styles.kvVal}>
                <span className={styles.codeBadge}>{database.host}</span>
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Database Name</span>
              <span className={styles.kvVal}>{database.databaseName}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Schema</span>
              <span className={styles.kvVal}>{database.schemaName}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>SSL Mode</span>
              <span className={styles.kvVal}>
                <span className={styles.codeBadge}>{database.sslMode}</span>
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Engine Version</span>
              <span className={styles.kvVal} style={{ fontSize: 12 }}>
                {database.version}
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Server Clock</span>
              <span className={styles.kvVal}>{database.serverTime}</span>
            </div>
            {database.error && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#f87171",
                  fontSize: 12,
                }}
              >
                {database.error}
              </div>
            )}
          </div>
        </div>

        {/* Email Service (SMTP Dispatcher) */}
        <div className={styles.serviceCard}>
          <div className={styles.serviceHeader}>
            <div className={styles.serviceHeaderLeft}>
              <div
                className={styles.serviceIconBox}
                style={{
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "#fbbf24",
                }}
              >
                <Mail size={20} />
              </div>
              <div>
                <h2 className={styles.serviceTitle}>Email Service (SMTP)</h2>
                <p className={styles.serviceSub}>Transactional Dispatcher (Nodemailer)</p>
              </div>
            </div>
            <div className={email.configured ? styles.statusPillOnline : styles.statusPillError}>
              <span className={styles.statusDot} />
              {email.configured ? "READY" : "INCOMPLETE"}
            </div>
          </div>

          <div className={styles.kvTable}>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>SMTP Host</span>
              <span className={styles.kvVal}>
                <span className={styles.codeBadge}>{email.host}</span>
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Port & Security</span>
              <span className={styles.kvVal}>
                Port {email.port} {email.secure ? "(SSL/TLS)" : "(STARTTLS)"}
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Auth User</span>
              <span className={styles.kvVal}>{email.user}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Sender Identity</span>
              <span className={styles.kvVal} style={{ fontSize: 12 }}>
                {email.from}
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Self-Signed Certs</span>
              <span className={styles.kvVal}>
                {email.allowSelfSigned ? "Allowed" : "Strict TLS"}
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Integrated Hooks</span>
              <span className={styles.kvVal} style={{ color: "#34d399" }}>
                Order Receipt • TrxID Status • Alerts
              </span>
            </div>
          </div>
        </div>

        {/* Telegram Order Alert Bot */}
        <div className={styles.serviceCard}>
          <div className={styles.serviceHeader}>
            <div className={styles.serviceHeaderLeft}>
              <div
                className={styles.serviceIconBox}
                style={{
                  background: "rgba(14, 165, 233, 0.12)",
                  color: "#38bdf8",
                }}
              >
                <Send size={20} />
              </div>
              <div>
                <h2 className={styles.serviceTitle}>Telegram Order Alert Bot</h2>
                <p className={styles.serviceSub}>Real-Time Interactive Admin Hook</p>
              </div>
            </div>
            <div className={telegram.configured ? styles.statusPillOnline : styles.statusPillError}>
              <span className={styles.statusDot} />
              {telegram.configured ? "ACTIVE" : "MISSING"}
            </div>
          </div>

          <div className={styles.kvTable}>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Bot Token</span>
              <span className={styles.kvVal}>
                <span className={styles.codeBadge}>{telegram.botTokenMasked}</span>
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Admin Chat ID</span>
              <span className={styles.kvVal}>
                <span className={styles.codeBadge}>{telegram.adminChatId}</span>
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Webhook Endpoint</span>
              <span className={styles.kvVal}>
                <span className={styles.codeBadge}>{telegram.webhookEndpoint}</span>
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Instant Verification</span>
              <span className={styles.kvVal} style={{ color: "#34d399" }}>
                Inline Buttons (Confirm / Wrong TrxID)
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Auto Sync</span>
              <span className={styles.kvVal}>Telegram Message Edit + Customer Email</span>
            </div>
          </div>
        </div>

        {/* Cloudinary & Media Storage */}
        <div className={styles.serviceCard}>
          <div className={styles.serviceHeader}>
            <div className={styles.serviceHeaderLeft}>
              <div
                className={styles.serviceIconBox}
                style={{
                  background: "rgba(168, 85, 247, 0.12)",
                  color: "#c084fc",
                }}
              >
                <Cloud size={20} />
              </div>
              <div>
                <h2 className={styles.serviceTitle}>Cloudinary Asset Storage</h2>
                <p className={styles.serviceSub}>Media CDN & Payment Proof Uploads</p>
              </div>
            </div>
            <div className={cloudinary.configured ? styles.statusPillOnline : styles.statusPillError}>
              <span className={styles.statusDot} />
              {cloudinary.configured ? "CONFIGURED" : "PARTIAL"}
            </div>
          </div>

          <div className={styles.kvTable}>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Cloud Name</span>
              <span className={styles.kvVal}>
                <span className={styles.codeBadge}>{cloudinary.cloudName}</span>
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>API Key</span>
              <span className={styles.kvVal}>
                {cloudinary.hasApiKey ? "Configured (Present)" : "Missing"}
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>API Secret</span>
              <span className={styles.kvVal}>
                {cloudinary.hasApiSecret ? "Configured (Secure)" : "Missing"}
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Media Destinations</span>
              <span className={styles.kvVal}>Product Covers & Payment Receipts</span>
            </div>
          </div>
        </div>

        {/* Server & Node.js Runtime */}
        <div className={styles.serviceCard}>
          <div className={styles.serviceHeader}>
            <div className={styles.serviceHeaderLeft}>
              <div
                className={styles.serviceIconBox}
                style={{
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#34d399",
                }}
              >
                <Server size={20} />
              </div>
              <div>
                <h2 className={styles.serviceTitle}>Node.js Runtime Environment</h2>
                <p className={styles.serviceSub}>Next.js 16.2.10 Turbopack Engine</p>
              </div>
            </div>
            <div className={styles.statusPillOnline}>
              <span className={styles.statusDot} />
              HEALTHY
            </div>
          </div>

          <div className={styles.kvTable}>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Node.js Version</span>
              <span className={styles.kvVal}>
                <span className={styles.codeBadge}>{server.nodeVersion}</span>
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Platform / Arch</span>
              <span className={styles.kvVal}>
                {server.platform} ({server.arch})
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Environment</span>
              <span className={styles.kvVal}>
                <span className={styles.codeBadge}>{server.environment}</span>
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Resident Memory (RSS)</span>
              <span className={styles.kvVal}>{server.memory.rssMb} MB</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>External Memory</span>
              <span className={styles.kvVal}>{server.memory.externalMb} MB</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Timezone</span>
              <span className={styles.kvVal}>{server.timezone} (UTC+6)</span>
            </div>
          </div>
        </div>

        {/* Database Record Counts */}
        <div className={styles.serviceCard}>
          <div className={styles.serviceHeader}>
            <div className={styles.serviceHeaderLeft}>
              <div
                className={styles.serviceIconBox}
                style={{
                  background: "rgba(99, 102, 241, 0.12)",
                  color: "#818cf8",
                }}
              >
                <Layers size={20} />
              </div>
              <div>
                <h2 className={styles.serviceTitle}>Database Entities & Records</h2>
                <p className={styles.serviceSub}>Prisma Client Entity Registry</p>
              </div>
            </div>
            <div className={styles.statusPillOnline}>
              <span className={styles.statusDot} />
              SYNCED
            </div>
          </div>

          <div className={styles.kvTable}>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Total Orders</span>
              <span className={styles.kvVal}>{stats.orders}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Payment Submitted</span>
              <span className={styles.kvVal} style={{ color: "#fbbf24" }}>
                {stats.paymentSubmitted}
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Verified & Completed</span>
              <span className={styles.kvVal} style={{ color: "#34d399" }}>
                {stats.paidOrders}
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Products (Active / Total)</span>
              <span className={styles.kvVal}>
                {stats.activeProducts} / {stats.products} ({stats.options} options)
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Categories</span>
              <span className={styles.kvVal}>{stats.categories}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Newsletter Subscribers</span>
              <span className={styles.kvVal}>{stats.newsletterSubscribers}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Admin Accounts</span>
              <span className={styles.kvVal}>{stats.adminUsers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
         API ENDPOINTS TELEMETRY TABLE
         ───────────────────────────────────────────────────────────── */}
      <div className={styles.tableCard}>
        <h2 className={styles.tableTitle}>Core API Route Telemetry</h2>
        <p className={styles.tableSub}>
          Monitored Next.js App Router API endpoints, routing methods, and functional purposes.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table className={styles.apiTable}>
            <thead>
              <tr>
                <th>Endpoint Path</th>
                <th>HTTP Methods</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map((ep) => (
                <tr key={ep.path}>
                  <td>
                    <span className={styles.codeBadge}>{ep.path}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {ep.methods.map((method) => (
                        <span
                          key={method}
                          className={method === "GET" ? styles.methodBadgeGet : styles.methodBadgePost}
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: "#cbd5e1" }}>{ep.description}</td>
                  <td>
                    <span className={styles.statusPillOnline}>
                      <span className={styles.statusDot} />
                      {ep.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

