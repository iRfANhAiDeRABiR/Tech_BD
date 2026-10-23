"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  ClipboardList,
  Search,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Package,
  Layers,
  DownloadCloud,
  ShieldAlert,
  Activity,
  User,
  KeyRound,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  RefreshCw,
} from "lucide-react";
import type { AdminEventLogItem, EventCategory } from "@/lib/audit-logs-store";
import { clearEventLogsAction } from "@/app/admin/actions";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import styles from "./EventLogs.module.css";

interface EventLogsClientProps {
  initialLogs: AdminEventLogItem[];
}

export function EventLogsClient({ initialLogs }: EventLogsClientProps) {
  const { t, lang, formatNumber } = useAdminLanguage();
  const [logs, setLogs] = useState<AdminEventLogItem[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Stats calculation
  const stats = useMemo(() => {
    const ordersCount = logs.filter((l) => l.category === "ORDERS").length;
    const catalogCount = logs.filter((l) => l.category === "CATALOG" || l.category === "CATEGORIES").length;
    const securityCount = logs.filter((l) => l.category === "SECURITY").length;
    return {
      total: logs.length,
      orders: ordersCount,
      catalog: catalogCount,
      security: securityCount,
    };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return logs.filter((l) => {
      // Category filter
      if (categoryFilter !== "ALL" && l.category !== categoryFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== "ALL" && l.severity !== severityFilter) {
        return false;
      }

      // Search keyword
      if (q) {
        const matchAction = l.action.toLowerCase().includes(q);
        const matchEntity = (l.entityName && l.entityName.toLowerCase().includes(q)) || false;
        const matchEntityId = (l.entityId && l.entityId.toLowerCase().includes(q)) || false;
        const matchAdmin = (l.adminEmail && l.adminEmail.toLowerCase().includes(q)) || false;
        const matchIp = (l.ipAddress && l.ipAddress.toLowerCase().includes(q)) || false;
        const matchDetails = (l.details && l.details.toLowerCase().includes(q)) || false;
        return matchAction || matchEntity || matchEntityId || matchAdmin || matchIp || matchDetails;
      }

      return true;
    });
  }, [logs, searchQuery, categoryFilter, severityFilter]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearLogs = () => {
    if (!confirm(t.logs_confirm_clear)) return;
    startTransition(async () => {
      await clearEventLogsAction();
      setLogs([]);
    });
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `admin-audit-logs-${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const exportToCsv = () => {
    const headers = ["ID", "Time", "Category", "Action", "EntityType", "EntityId", "EntityName", "AdminEmail", "IP", "Severity", "Details"];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.createdAt).toISOString(),
      l.category,
      l.action,
      l.entityType,
      l.entityId || "",
      `"${(l.entityName || "").replace(/"/g, '""')}"`,
      l.adminEmail || "",
      l.ipAddress || "",
      l.severity,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", encodeURI(csvContent));
    dlAnchorElem.setAttribute("download", `admin-audit-logs-${Date.now()}.csv`);
    dlAnchorElem.click();
  };

  const getCategoryIcon = (cat: EventCategory) => {
    switch (cat) {
      case "ORDERS":
        return <ShoppingBag size={14} color="#10b981" />;
      case "CATALOG":
        return <Package size={14} color="#38bdf8" />;
      case "CATEGORIES":
        return <Layers size={14} color="#818cf8" />;
      case "DOWNLOADS":
        return <DownloadCloud size={14} color="#a855f7" />;
      case "SECURITY":
        return <ShieldAlert size={14} color="#ef4444" />;
      case "AUTH":
        return <KeyRound size={14} color="#f59e0b" />;
      default:
        return <Activity size={14} color="#94a3b8" />;
    }
  };

  const getCategoryBadgeClass = (cat: EventCategory) => {
    switch (cat) {
      case "ORDERS":
        return styles.badgeOrders;
      case "CATALOG":
      case "CATEGORIES":
        return styles.badgeCatalog;
      case "DOWNLOADS":
        return styles.badgeDownloads;
      case "SECURITY":
        return styles.badgeSecurity;
      case "AUTH":
        return styles.badgeAuth;
      default:
        return styles.badgeSystem;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return lang === "bn" ? "এইমাত্র (Just now)" : "Just now";
      if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        return lang === "bn" ? `${formatNumber(mins)} মিনিট আগে` : `${mins} min ago`;
      }
      if (diffSec < 86400) {
        const hours = Math.floor(diffSec / 3600);
        return lang === "bn" ? `${formatNumber(hours)} ঘণ্টা আগে` : `${hours} hours ago`;
      }
      return new Date(isoString).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div>
      {/* ── Top Header ── */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headerTitle}>
            <ClipboardList size={26} color="#6366f1" />
            <span>{t.logs_page_title}</span>
          </h1>
          <p className={styles.headerSubtitle}>{t.logs_page_subtitle}</p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.actionBtn} onClick={exportToJson} title="Download JSON">
            <Download size={15} />
            <span>JSON</span>
          </button>

          <button type="button" className={styles.actionBtn} onClick={exportToCsv} title="Download CSV">
            <FileText size={15} />
            <span>{t.logs_btn_export}</span>
          </button>

          {logs.length > 0 && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={handleClearLogs}
              disabled={isPending}
              title={t.logs_btn_clear}
            >
              <Trash2 size={15} />
              <span>{isPending ? t.logs_btn_clearing : t.logs_btn_clear}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <ClipboardList size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>{t.logs_stat_total}</span>
            <span className={styles.statValue}>{formatNumber(stats.total)}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
            <ShoppingBag size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>{t.logs_stat_orders}</span>
            <span className={styles.statValue}>{formatNumber(stats.orders)}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(14, 165, 233, 0.15)", color: "#38bdf8" }}>
            <Package size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>{t.logs_stat_catalog}</span>
            <span className={styles.statValue}>{formatNumber(stats.catalog)}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
            <ShieldAlert size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>{t.logs_stat_security}</span>
            <span className={styles.statValue}>{formatNumber(stats.security)}</span>
          </div>
        </div>
      </div>

      {/* ── Controls & Filter Bar ── */}
      <div className={styles.controlsRow}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t.logs_search_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Category Filter */}
          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "ALL" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("ALL")}
            >
              {t.logs_cat_all}
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "ORDERS" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("ORDERS")}
            >
              {t.logs_cat_orders}
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "CATALOG" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("CATALOG")}
            >
              {t.logs_cat_catalog}
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "DOWNLOADS" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("DOWNLOADS")}
            >
              {t.logs_cat_downloads}
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "SECURITY" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("SECURITY")}
            >
              {t.logs_cat_security}
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "AUTH" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("AUTH")}
            >
              {t.logs_cat_auth}
            </button>
          </div>

          {/* Severity Filter */}
          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.filterBtn} ${severityFilter === "ALL" ? styles.filterBtnActive : ""}`}
              onClick={() => setSeverityFilter("ALL")}
            >
              {t.logs_sev_all}
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${severityFilter === "SUCCESS" ? styles.filterBtnActive : ""}`}
              onClick={() => setSeverityFilter("SUCCESS")}
            >
              {t.logs_sev_success}
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${severityFilter === "WARNING" ? styles.filterBtnActive : ""}`}
              onClick={() => setSeverityFilter("WARNING")}
            >
              {t.logs_sev_warning}
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${severityFilter === "CRITICAL" ? styles.filterBtnActive : ""}`}
              onClick={() => setSeverityFilter("CRITICAL")}
            >
              {t.logs_sev_critical}
            </button>
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 140 }}>{t.logs_th_time}</th>
                <th style={{ width: 120 }}>{t.logs_th_category}</th>
                <th style={{ width: 160 }}>{t.logs_th_action}</th>
                <th style={{ width: 180 }}>{t.logs_th_target}</th>
                <th>{t.logs_th_details}</th>
                <th style={{ width: 150 }}>{t.logs_th_admin}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogIds.has(log.id);
                  let parsedJson: any = null;
                  if (log.details && (log.details.startsWith("{") || log.details.startsWith("["))) {
                    try {
                      parsedJson = JSON.parse(log.details);
                    } catch {
                      parsedJson = null;
                    }
                  }

                  return (
                    <tr key={log.id}>
                      {/* Time */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            {formatRelativeTime(log.createdAt)}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className={`${styles.badge} ${getCategoryBadgeClass(log.category)}`}>
                          {getCategoryIcon(log.category)}
                          <span>{log.category}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <span className={styles.actionCodeTag}>{log.action}</span>
                      </td>

                      {/* Target Entity */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            {log.entityName || log.entityId || "—"}
                          </span>
                          <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                            {log.entityType} {log.entityId && log.entityName ? `(#${log.entityId})` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Details */}
                      <td>
                        <div style={{ maxWidth: 360 }}>
                          {!log.details ? (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>—</span>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={styles.diffToggleBtn}
                                onClick={() => toggleExpand(log.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <span>{t.logs_toggle_hide}</span>
                                    <ChevronUp size={13} />
                                  </>
                                ) : (
                                  <>
                                    <span>{t.logs_toggle_show}</span>
                                    <ChevronDown size={13} />
                                  </>
                                )}
                              </button>

                              {isExpanded && (
                                <div className={styles.diffBox}>
                                  {parsedJson ? JSON.stringify(parsedJson, null, 2) : log.details}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Admin */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <User size={14} color="#6366f1" />
                          <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                            {log.adminEmail || "Admin"}
                          </span>
                        </div>
                        {log.ipAddress && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "monospace", marginTop: 2 }}>
                            IP: {log.ipAddress}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <ClipboardList size={40} style={{ opacity: 0.4 }} />
                      <h4>{t.logs_empty_title}</h4>
                      <p>{t.logs_empty_sub}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
