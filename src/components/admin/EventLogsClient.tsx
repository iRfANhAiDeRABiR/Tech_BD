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
import styles from "./EventLogs.module.css";

interface EventLogsClientProps {
  initialLogs: AdminEventLogItem[];
}

export function EventLogsClient({ initialLogs }: EventLogsClientProps) {
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
        const matchType = l.entityType.toLowerCase().includes(q);
        const matchEmail = (l.adminEmail && l.adminEmail.toLowerCase().includes(q)) || false;
        const matchDetails = (l.details && l.details.toLowerCase().includes(q)) || false;
        const matchIp = (l.ipAddress && l.ipAddress.toLowerCase().includes(q)) || false;

        return matchAction || matchEntity || matchEntityId || matchType || matchEmail || matchDetails || matchIp;
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
    if (!confirm("আপনি কি নিশ্চিত সমস্ত ইভেন্ট হিস্টোরি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।")) {
      return;
    }
    startTransition(async () => {
      await clearEventLogsAction();
      setLogs([]);
    });
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `techbd-event-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCsv = () => {
    const headers = ["Timestamp", "Action", "Category", "Entity Type", "Entity Name", "Admin", "Severity", "Details"];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.createdAt).toLocaleString()}"`,
      `"${l.action}"`,
      `"${l.category}"`,
      `"${l.entityType}"`,
      `"${l.entityName || l.entityId || ""}"`,
      `"${l.adminEmail || "Admin"}"`,
      `"${l.severity}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `techbd-event-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
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

      if (diffSec < 60) return "এইমাত্র (Just now)";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} মিনিট আগে`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ঘণ্টা আগে`;
      return new Date(isoString).toLocaleDateString("bn-BD", {
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
            <span>ইভেন্ট ও অ্যাক্টিভিটি পরিবর্তন লগ (Audit & Event Logs)</span>
          </h1>
          <p className={styles.headerSubtitle}>
            অ্যাডমিন প্যানেলে কৃত যেকোনো পরিবর্তন—অর্ডার স্ট্যাটাস, প্রোডাক্ট ও ক্যাটালগ এডিট, ডাউনলোড লিঙ্ক বা সিকিউরিটি ব্যানের বিস্তারিত ইতিহাস।
          </p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.actionBtn} onClick={exportToJson} title="JSON ফরম্যাটে ডাউনলোড করুন">
            <Download size={15} />
            <span>JSON এক্সপোর্ট</span>
          </button>

          <button type="button" className={styles.actionBtn} onClick={exportToCsv} title="CSV স্প্রেডশিট ডাউনলোড করুন">
            <FileText size={15} />
            <span>CSV এক্সপোর্ট</span>
          </button>

          {logs.length > 0 && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={handleClearLogs}
              disabled={isPending}
              title="সমস্ত লগ মুছে ফেলুন"
            >
              <Trash2 size={15} />
              <span>লগ মুছে ফেলুন</span>
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
            <span className={styles.statLabel}>মোট রেকর্ডকৃত ইভেন্ট</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
            <ShoppingBag size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>অর্ডার ও পেমেন্ট সংক্রান্ত</span>
            <span className={styles.statValue}>{stats.orders}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(14, 165, 233, 0.15)", color: "#38bdf8" }}>
            <Package size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>প্রোডাক্ট ও ক্যাটালগ এডিট</span>
            <span className={styles.statValue}>{stats.catalog}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
            <ShieldAlert size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>সিকিউরিটি ও ব্যান ইভেন্ট</span>
            <span className={styles.statValue}>{stats.security}</span>
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
            placeholder="অ্যাকশন, প্রোডাক্ট, অর্ডার বা অ্যাডমিন ইমেইল খুঁজুন..."
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
              সব ক্যাটাগরি
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "ORDERS" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("ORDERS")}
            >
              📦 অর্ডার
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "CATALOG" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("CATALOG")}
            >
              🏷️ প্রোডাক্ট
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "DOWNLOADS" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("DOWNLOADS")}
            >
              📥 ডাউনলোড
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${categoryFilter === "SECURITY" ? styles.filterBtnActive : ""}`}
              onClick={() => setCategoryFilter("SECURITY")}
            >
              🛡️ সিকিউরিটি
            </button>
          </div>
        </div>
      </div>

      {/* ── Event Log Table ── */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>সময় (Timestamp)</th>
                <th>ক্যাটাগরি</th>
                <th>অ্যাকশন (Action)</th>
                <th>টার্গেট এনটিটি (Target)</th>
                <th>পরিবর্তনের সারসংক্ষেপ (Changes Summary)</th>
                <th>অ্যাডমিন</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogIds.has(log.id);

                  let parsedJson: any = null;
                  if (log.details) {
                    try {
                      parsedJson = JSON.parse(log.details);
                    } catch {
                      parsedJson = null;
                    }
                  }

                  return (
                    <tr key={log.id}>
                      {/* Timestamp */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {formatRelativeTime(log.createdAt)}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td>
                        <span className={`${styles.badge} ${getCategoryBadgeClass(log.category)}`}>
                          {log.category}
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <span className={styles.actionPill}>{log.action}</span>
                      </td>

                      {/* Target Entity */}
                      <td>
                        <div>
                          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)", display: "block" }}>
                            {log.entityType}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                            {log.entityName || log.entityId || "—"}
                          </strong>
                          {log.entityId && log.entityName && log.entityId !== log.entityName && (
                            <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                              ID: {log.entityId}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Changes Summary & JSON Diff */}
                      <td>
                        <div>
                          {parsedJson ? (
                            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                              {Object.entries(parsedJson).slice(0, 3).map(([key, val]) => (
                                <div key={key}>
                                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{key}:</span>{" "}
                                  <span>{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                              {log.details || "কোনো অতিরিক্ত ডেটা নেই"}
                            </span>
                          )}

                          {log.details && (
                            <>
                              <button
                                type="button"
                                className={styles.diffToggleBtn}
                                onClick={() => toggleExpand(log.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <span>লুকান</span>
                                    <ChevronUp size={13} />
                                  </>
                                ) : (
                                  <>
                                    <span>সম্পূর্ণ ডিটেইলস দেখুন</span>
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
                      <h4>কোনো ইভেন্ট লগ পাওয়া যায়নি</h4>
                      <p>অ্যাডমিন প্যানেলে কোনো তথ্য পরিবর্তন বা আপডেট হলে তা স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত হবে।</p>
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

