"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  UserX,
  Globe,
  Plus,
  Search,
  Filter,
  X,
  Trash2,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Lock,
  User,
  Shuffle,
  Activity,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Radar,
  ListFilter,
} from "lucide-react";
import type { AccessBanItem, RegisteredUserSummary } from "@/lib/bans-store";
import type { RecentIpActivityItem } from "@/lib/audit-logs-store";
import {
  createBanAction,
  revokeBanAction,
  reactivateBanAction,
  deleteBanAction,
} from "@/app/admin/actions";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import type { AdminLanguage } from "@/lib/admin-translations";
import styles from "./AccessBans.module.css";

interface AccessBansClientProps {
  initialBans: AccessBanItem[];
  registeredUsers: RegisteredUserSummary[];
  recentIps?: RecentIpActivityItem[];
  visitorIp?: string;
  initialTarget?: string;
  initialType?: string;
  initialReason?: string;
}

const REASON_PRESETS: Record<AdminLanguage, string[]> = {
  en: [
    "Payment Fraud / Fake Transaction ID",
    "Spamming Fake Orders",
    "Automated Bot / Scraping Activity",
    "Abusive Behavior in Support",
    "DDoS / Excessive Requests",
    "Terms & Policy Violation",
    "Custom Reason",
  ],
  bn: [
    "Payment Fraud / ভুয়া ট্রানজেকশন আইডি প্রদান",
    "Spamming Fake Orders / একের পর এক ভুয়া অর্ডার",
    "Automated Bot / Scraping / স্ক্র্যাপিং বা বট অ্যাক্টিভিটি",
    "Abusive Behavior / কাস্টমার সাপোর্টে অশোভন আচরণ",
    "DDoS / Excessive Requests / অস্বাভাবিক রিকোয়েস্ট বন্যা",
    "Terms & Policy Violation / সাইট নীতিমালার স্পষ্ট লঙ্ঘন",
    "Custom Reason (অন্যান্য কারণ)",
  ],
};

export function AccessBansClient({
  initialBans,
  registeredUsers,
  recentIps = [],
  visitorIp = "127.0.0.1",
  initialTarget,
  initialType,
  initialReason,
}: AccessBansClientProps) {
  const { t, lang, formatNumber } = useAdminLanguage();
  const [bans, setBans] = useState<AccessBanItem[]>(initialBans);
  const [activeView, setActiveView] = useState<"BANS" | "IP_TRACKER">("BANS");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IP" | "USER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "REVOKED" | "EXPIRED">("ALL");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const reasonPresets = REASON_PRESETS[lang] ?? REASON_PRESETS.en;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [banType, setBanType] = useState<"IP" | "USER">(
    (initialType === "USER" ? "USER" : "IP") as "IP" | "USER"
  );
  const [targetInput, setTargetInput] = useState(initialTarget || "");
  const [selectedUser, setSelectedUser] = useState<RegisteredUserSummary | null>(null);
  const [userSearchText, setUserSearchText] = useState("");
  const [reasonPreset, setReasonPreset] = useState(initialReason || reasonPresets[0]);
  const [customReason, setCustomReason] = useState("");
  const [duration, setDuration] = useState<"PERMANENT" | "24H" | "7D" | "30D" | "CUSTOM">("PERMANENT");
  const [customExpiresAt, setCustomExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Sync reason preset when language changes if still on default
  useEffect(() => {
    if (!initialReason && !customReason) {
      setReasonPreset(reasonPresets[0]);
    }
  }, [lang, reasonPresets, initialReason, customReason]);

  // Auto-open modal if initialTarget was passed via query
  useEffect(() => {
    if (initialTarget) {
      setTargetInput(initialTarget);
      if (initialType === "USER") {
        setBanType("USER");
      } else {
        setBanType("IP");
      }
      if (initialReason) {
        setReasonPreset(lang === "bn" ? "Custom Reason (অন্যান্য কারণ)" : "Custom Reason");
        setCustomReason(initialReason);
      }
      setShowModal(true);
    }
  }, [initialTarget, initialType, initialReason, lang]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const active = bans.filter((b) => b.isActive && (!b.expiresAt || new Date(b.expiresAt) > now));
    const ipBans = active.filter((b) => b.type === "IP");
    const userBans = active.filter((b) => b.type === "USER");
    const totalHits = bans.reduce((acc, b) => acc + (b.hitCount || 0), 0);
    return {
      activeCount: active.length,
      ipCount: ipBans.length,
      userCount: userBans.length,
      totalHits,
    };
  }, [bans]);

  // Filtered Bans List
  const filteredBans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();

    return bans.filter((b) => {
      if (typeFilter !== "ALL" && b.type !== typeFilter) return false;

      if (statusFilter === "ACTIVE") {
        if (!b.isActive || (b.expiresAt && new Date(b.expiresAt) <= now)) return false;
      } else if (statusFilter === "REVOKED") {
        if (b.isActive) return false;
      } else if (statusFilter === "EXPIRED") {
        if (!b.isActive || !b.expiresAt || new Date(b.expiresAt) > now) return false;
      }

      if (q) {
        const matchesTarget = b.target.toLowerCase().includes(q);
        const matchesEmail = b.targetEmail?.toLowerCase().includes(q) || false;
        const matchesUsername = b.targetUsername?.toLowerCase().includes(q) || false;
        const matchesPhone = b.targetPhone?.toLowerCase().includes(q) || false;
        const matchesReason = b.reason.toLowerCase().includes(q);
        const matchesNotes = b.notes?.toLowerCase().includes(q) || false;
        return matchesTarget || matchesEmail || matchesUsername || matchesPhone || matchesReason || matchesNotes;
      }

      return true;
    });
  }, [bans, searchQuery, typeFilter, statusFilter]);

  // Filtered Recent IPs List
  const filteredRecentIps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recentIps;

    return recentIps.filter((item) => {
      const matchIp = item.ip.toLowerCase().includes(q);
      const matchAction = item.lastAction?.toLowerCase().includes(q) || false;
      const matchEmail = item.associatedEmail?.toLowerCase().includes(q) || false;
      const matchName = item.associatedName?.toLowerCase().includes(q) || false;
      const matchOrder = item.orderNumber?.toLowerCase().includes(q) || false;
      return matchIp || matchAction || matchEmail || matchName || matchOrder;
    });
  }, [recentIps, searchQuery]);

  // Registered Users search for User Ban modal
  const filteredUsers = useMemo(() => {
    const q = userSearchText.trim().toLowerCase();
    if (!q) return registeredUsers.slice(0, 8);
    return registeredUsers
      .filter((u) => {
        const matchName = u.fullName?.toLowerCase().includes(q) || false;
        const matchUsername = u.username?.toLowerCase().includes(q) || false;
        const matchEmail = u.email?.toLowerCase().includes(q) || false;
        const matchPhone = u.phone?.toLowerCase().includes(q) || false;
        return matchName || matchUsername || matchEmail || matchPhone;
      })
      .slice(0, 8);
  }, [registeredUsers, userSearchText]);

  // Handlers
  const handleCopyIp = (ip: string) => {
    navigator.clipboard?.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleUseVisitorIp = () => {
    setTargetInput(visitorIp);
  };

  const handleGenerateRandomIp = () => {
    const randomIp = `${Math.floor(Math.random() * 200) + 20}.${Math.floor(
      Math.random() * 255
    )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
    setTargetInput(randomIp);
  };

  const handleSelectUser = (user: RegisteredUserSummary) => {
    setSelectedUser(user);
    setTargetInput(user.email || user.username || user.id);
  };

  const resetForm = () => {
    setTargetInput("");
    setSelectedUser(null);
    setUserSearchText("");
    setReasonPreset(reasonPresets[0]);
    setCustomReason("");
    setDuration("PERMANENT");
    setCustomExpiresAt("");
    setNotes("");
    setFormError(null);
  };

  const handleRevoke = (id: string) => {
    const confirmMsg =
      lang === "bn"
        ? "আপনি কি নিশ্চিত এই ব্যানটি তুলে নিতে চান?"
        : "Are you sure you want to revoke this ban?";
    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      await revokeBanAction(id);
      setBans((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: false } : b))
      );
    });
  };

  const handleReactivate = (id: string) => {
    const confirmMsg =
      lang === "bn"
        ? "আপনি কি এই ব্যানটি পুনরায় সক্রিয় করতে চান?"
        : "Are you sure you want to reactivate this ban?";
    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      await reactivateBanAction(id);
      setBans((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: true } : b))
      );
    });
  };

  const handleDelete = (id: string) => {
    const confirmMsg =
      lang === "bn"
        ? "আপনি কি নিশ্চিত যে এই ব্যান রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?"
        : "Are you sure you want to permanently delete this ban record?";
    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      await deleteBanAction(id);
      setBans((prev) => prev.filter((b) => b.id !== id));
    });
  };

  const handleQuickBanIp = (ipItem: RecentIpActivityItem) => {
    setBanType("IP");
    setTargetInput(ipItem.ip);
    const defaultReason =
      lang === "bn"
        ? `আইপি ট্র্যাকার থেকে দ্রুত ব্যান (${ipItem.lastAction || "Activity"})`
        : `Quick ban from IP Tracker (${ipItem.lastAction || "Activity"})`;
    setReasonPreset(reasonPresets[0]);
    setNotes(defaultReason);
    setShowModal(true);
  };

  const handleSubmitBan = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const target = targetInput.trim();
    if (!target) {
      setFormError(lang === "bn" ? "টার্গেট আইপি বা ইউজার প্রদান করুন" : "Please provide a target IP or user");
      return;
    }

    const finalReason =
      reasonPreset.startsWith("Custom Reason") || reasonPreset.includes("অন্যান্য")
        ? customReason.trim() || reasonPreset
        : reasonPreset;

    const formData = new FormData();
    formData.set("type", banType);
    formData.set("target", target);
    formData.set("reason", finalReason);
    formData.set("duration", duration);
    if (duration === "CUSTOM" && customExpiresAt) {
      formData.set("customExpiresAt", customExpiresAt);
    }
    if (notes.trim()) {
      formData.set("notes", notes.trim());
    }

    if (banType === "USER" && selectedUser) {
      if (selectedUser.id) formData.set("targetUserId", selectedUser.id);
      if (selectedUser.email) formData.set("targetEmail", selectedUser.email);
      if (selectedUser.phone) formData.set("targetPhone", selectedUser.phone);
      if (selectedUser.username) formData.set("targetUsername", selectedUser.username);
    }

    startTransition(async () => {
      try {
        await createBanAction(formData);
        setShowModal(false);
        resetForm();
      } catch (err: any) {
        setFormError(err?.message || (lang === "bn" ? "ব্যান প্রয়োগ ব্যর্থ হয়েছে" : "Failed to enforce ban"));
      }
    });
  };

  const dateLocale = lang === "bn" ? "bn-BD" : "en-US";

  return (
    <div>
      {/* ── Top Header ── */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headerTitle}>
            <ShieldAlert size={26} color="#ef4444" />
            <span>{t.bans_page_title}</span>
          </h1>
          <p className={styles.headerSubtitle}>{t.bans_page_subtitle}</p>
        </div>

        <button
          type="button"
          className={styles.primaryAddBtn}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          <span>{t.bans_add_btn}</span>
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
            <Lock size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>{t.bans_stat_active}</span>
            <span className={styles.statValue}>{formatNumber(stats.activeCount)}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <Globe size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>{t.bans_stat_ip}</span>
            <span className={styles.statValue}>{formatNumber(stats.ipCount)}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <UserX size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>{t.bans_stat_user}</span>
            <span className={styles.statValue}>{formatNumber(stats.userCount)}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(14, 165, 233, 0.15)", color: "#38bdf8" }}>
            <Radar size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>{t.bans_stat_recent_ips}</span>
            <span className={styles.statValue}>{formatNumber(recentIps.length)}</span>
          </div>
        </div>
      </div>

      {/* ── Main View Switcher Tabs ── */}
      <div className={styles.mainViewTabs}>
        <button
          type="button"
          className={`${styles.mainViewTabBtn} ${activeView === "BANS" ? styles.mainViewTabBtnActive : ""}`}
          onClick={() => setActiveView("BANS")}
        >
          <ShieldAlert size={16} />
          <span>{t.bans_tab_list(formatNumber(bans.length))}</span>
        </button>

        <button
          type="button"
          className={`${styles.mainViewTabBtn} ${activeView === "IP_TRACKER" ? styles.mainViewTabBtnActive : ""}`}
          onClick={() => setActiveView("IP_TRACKER")}
        >
          <Radar size={16} />
          <span>{t.bans_tab_tracker(formatNumber(recentIps.length))}</span>
        </button>
      </div>

      {/* ── View 1: Active Bans List ── */}
      {activeView === "BANS" && (
        <>
          {/* Controls & Filter Bar */}
          <div className={styles.controlsRow}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder={t.bans_search_placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* Type Filter */}
              <div className={styles.filterTabs}>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${typeFilter === "ALL" ? styles.filterBtnActive : ""}`}
                  onClick={() => setTypeFilter("ALL")}
                >
                  {t.bans_filter_all}
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${typeFilter === "IP" ? styles.filterBtnActive : ""}`}
                  onClick={() => setTypeFilter("IP")}
                >
                  {t.bans_filter_ip}
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${typeFilter === "USER" ? styles.filterBtnActive : ""}`}
                  onClick={() => setTypeFilter("USER")}
                >
                  {t.bans_filter_user}
                </button>
              </div>

              {/* Status Filter */}
              <div className={styles.filterTabs}>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${statusFilter === "ALL" ? styles.filterBtnActive : ""}`}
                  onClick={() => setStatusFilter("ALL")}
                >
                  {t.bans_status_all}
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${statusFilter === "ACTIVE" ? styles.filterBtnActive : ""}`}
                  onClick={() => setStatusFilter("ACTIVE")}
                >
                  {t.bans_status_active}
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${statusFilter === "REVOKED" ? styles.filterBtnActive : ""}`}
                  onClick={() => setStatusFilter("REVOKED")}
                >
                  {t.bans_status_revoked}
                </button>
              </div>
            </div>
          </div>

          {/* Table of Bans */}
          <div className={styles.tableContainer}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t.bans_th_target}</th>
                    <th>{t.bans_th_type}</th>
                    <th>{t.bans_th_reason}</th>
                    <th>{t.bans_th_duration}</th>
                    <th>{t.bans_th_hits}</th>
                    <th>{t.bans_th_date_by}</th>
                    <th>{t.bans_th_status}</th>
                    <th style={{ textAlign: "right" }}>{t.bans_th_action}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBans.length > 0 ? (
                    filteredBans.map((ban) => {
                      const now = new Date();
                      const isExpired = ban.isActive && ban.expiresAt && new Date(ban.expiresAt) <= now;
                      const isEffectiveActive = ban.isActive && !isExpired;

                      return (
                        <tr key={ban.id}>
                          {/* Target */}
                          <td>
                            <div className={styles.targetWrap}>
                              <div
                                className={styles.targetIconBox}
                                style={{
                                  background: ban.type === "IP" ? "rgba(99, 102, 241, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                  color: ban.type === "IP" ? "#818cf8" : "#fbbf24",
                                }}
                              >
                                {ban.type === "IP" ? <Globe size={18} /> : <User size={18} />}
                              </div>
                              <div className={styles.targetDetails}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span className={styles.targetValue}>{ban.target}</span>
                                  {ban.type === "IP" && (
                                    <button
                                      type="button"
                                      className={styles.copyCodeBtn}
                                      onClick={() => handleCopyIp(ban.target)}
                                      title={t.bans_copy_ip}
                                    >
                                      {copiedIp === ban.target ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                    </button>
                                  )}
                                </div>
                                {ban.type === "USER" && (
                                  <span className={styles.targetSubtext}>
                                    {ban.targetUsername ? `@${ban.targetUsername}` : ""}
                                    {ban.targetEmail ? ` • ${ban.targetEmail}` : ""}
                                    {ban.targetPhone ? ` • ${ban.targetPhone}` : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td>
                            <span className={`${styles.badge} ${ban.type === "IP" ? styles.badgeIp : styles.badgeUser}`}>
                              {ban.type === "IP" ? "🌐 IP Address" : "👤 User Account"}
                            </span>
                          </td>

                          {/* Reason & Notes */}
                          <td>
                            <div style={{ maxWidth: 260 }}>
                              <strong style={{ display: "block", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                {ban.reason}
                              </strong>
                              {ban.notes && (
                                <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                  {ban.notes}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Duration / Expiry */}
                          <td>
                            {ban.expiresAt ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                                  {new Date(ban.expiresAt).toLocaleDateString(dateLocale, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span style={{ fontSize: "0.74rem", color: isExpired ? "#ef4444" : "var(--text-secondary)" }}>
                                  {isExpired ? t.bans_expired : t.bans_timed}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ef4444" }}>
                                {t.bans_permanent}
                              </span>
                            )}
                          </td>

                          {/* Hit Count */}
                          <td>
                            <span className={styles.hitCounter}>
                              <AlertTriangle size={12} />
                              {formatNumber(ban.hitCount || 0)}
                            </span>
                          </td>

                          {/* Date & Admin */}
                          <td>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                              <div>{new Date(ban.createdAt).toLocaleDateString(dateLocale)}</div>
                              <div>{t.bans_by(ban.bannedBy || "Admin")}</div>
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            {isEffectiveActive ? (
                              <span className={`${styles.badge} ${styles.badgeActive}`}>
                                {t.bans_active_badge}
                              </span>
                            ) : isExpired ? (
                              <span className={`${styles.badge} ${styles.badgeExpired}`}>
                                {t.bans_expired}
                              </span>
                            ) : (
                              <span className={`${styles.badge} ${styles.badgeRevoked}`}>
                                {t.bans_revoked_badge}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: "right" }}>
                            <div className={styles.actionsWrap} style={{ justifyContent: "flex-end" }}>
                              {isEffectiveActive ? (
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => handleRevoke(ban.id)}
                                  disabled={isPending}
                                  title={t.bans_action_revoke}
                                >
                                  {t.bans_action_revoke}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                  onClick={() => handleReactivate(ban.id)}
                                  disabled={isPending}
                                  title={t.bans_action_reactivate}
                                >
                                  {t.bans_action_reactivate}
                                </button>
                              )}

                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() => handleDelete(ban.id)}
                                disabled={isPending}
                                title={t.bans_action_delete}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.emptyState}>
                          <ShieldCheck size={40} style={{ opacity: 0.4 }} />
                          <h4>{t.bans_empty_title}</h4>
                          <p>{t.bans_empty_sub}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── View 2: Recent IPs Tracker ── */}
      {activeView === "IP_TRACKER" && (
        <>
          <div className={styles.ipTrackerHeader}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {t.tracker_header_title}
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                {t.tracker_header_sub}
              </p>
            </div>
            <div className={styles.searchBox} style={{ maxWidth: 300 }}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder={lang === "bn" ? "আইপি দিয়ে ফিল্টার করুন..." : "Filter by IP..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t.tracker_th_ip}</th>
                    <th>{t.tracker_th_source}</th>
                    <th>{t.tracker_th_events}</th>
                    <th>{t.tracker_th_last_seen}</th>
                    <th>{t.tracker_th_ban_status}</th>
                    <th style={{ textAlign: "right" }}>{t.tracker_th_action}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecentIps.length > 0 ? (
                    filteredRecentIps.map((item) => (
                      <tr key={item.ip}>
                        {/* IP Address */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className={styles.ipMonospace}>{item.ip}</span>
                            <button
                              type="button"
                              className={styles.copyCodeBtn}
                              onClick={() => handleCopyIp(item.ip)}
                              title={t.bans_copy_ip}
                            >
                              {copiedIp === item.ip ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            </button>
                            {item.ip === visitorIp && (
                              <span style={{ fontSize: "0.68rem", padding: "1px 6px", borderRadius: 4, background: "rgba(14, 165, 233, 0.15)", color: "#38bdf8", fontWeight: 700 }}>
                                {lang === "bn" ? "আপনার বর্তমান আইপি" : "Your Current IP"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Source Event */}
                        <td>
                          <div>
                            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                              {item.lastAction}
                            </span>
                            {item.orderNumber && (
                              <div style={{ marginTop: 2 }}>
                                <span style={{ fontSize: "0.76rem", color: "#6366f1", fontWeight: 600 }}>
                                  #{item.orderNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Count */}
                        <td>
                          <span style={{ fontSize: "0.84rem", fontWeight: 700 }}>
                            {formatNumber(item.count)} {lang === "bn" ? "বার" : "events"}
                          </span>
                        </td>

                        {/* Last Seen */}
                        <td>
                          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                            {new Date(item.lastSeenAt).toLocaleString(dateLocale, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        {/* Ban Status */}
                        <td>
                          {item.isBanned ? (
                            <span className={`${styles.badge} ${styles.badgeActive}`}>
                              {t.tracker_banned_label}
                            </span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeAllowed}`}>
                              {lang === "bn" ? "✓ স্বাভাবিক (Allowed)" : "✓ Allowed"}
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: "right" }}>
                          {item.isBanned ? (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => {
                                if (item.banId) handleRevoke(item.banId);
                              }}
                            >
                              {t.bans_action_revoke}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.quickBanBtn}
                              onClick={() => handleQuickBanIp(item)}
                            >
                              <ShieldAlert size={13} />
                              <span>{t.tracker_ban_btn}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className={styles.emptyState}>
                          <Radar size={40} style={{ opacity: 0.4 }} />
                          <h4>{t.tracker_empty_title}</h4>
                          <p>{t.tracker_empty_sub}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Add Ban Modal ── */}
      {showModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalIcon}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>{t.bans_modal_title}</h3>
                  <p className={styles.modalSubtitle}>{t.bans_modal_desc}</p>
                </div>
              </div>

              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Type selector tabs */}
            <div className={styles.typeTabs}>
              <button
                type="button"
                className={`${styles.typeTabBtn} ${banType === "IP" ? styles.typeTabBtnActive : ""}`}
                onClick={() => {
                  setBanType("IP");
                  setSelectedUser(null);
                }}
              >
                <Globe size={16} />
                <span>{t.bans_modal_opt_ip}</span>
              </button>

              <button
                type="button"
                className={`${styles.typeTabBtn} ${banType === "USER" ? styles.typeTabBtnActive : ""}`}
                onClick={() => {
                  setBanType("USER");
                }}
              >
                <UserX size={16} />
                <span>{t.bans_modal_opt_user}</span>
              </button>
            </div>

            <form onSubmit={handleSubmitBan}>
              {/* Form Error */}
              {formError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    fontSize: "0.84rem",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* IP Input */}
              {banType === "IP" ? (
                <div className={styles.formGroup}>
                  <div className={styles.formLabel}>
                    <span>{t.bans_modal_label_ip}</span>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        className={styles.quickActionLink}
                        onClick={handleUseVisitorIp}
                      >
                        {lang === "bn" ? `আমার আইপি (${visitorIp})` : `My IP (${visitorIp})`}
                      </button>
                      <button
                        type="button"
                        className={styles.quickActionLink}
                        onClick={handleGenerateRandomIp}
                      >
                        {lang === "bn" ? "🎲 র‍্যান্ডম আইপি বানান" : "🎲 Random IP"}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder={lang === "bn" ? "যেমন: 203.0.113.45 বা 192.168.1.0/24" : "e.g. 203.0.113.45 or 192.168.1.0/24"}
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                    {lang === "bn"
                      ? "একক আইপি (IPv4/IPv6) অথবা সাবনেট সিআইডিআর রেঞ্জ দেওয়া যাবে।"
                      : "Supports single IPv4/IPv6 or CIDR subnet ranges."}
                  </span>
                </div>
              ) : (
                /* User Input */
                <div className={styles.formGroup}>
                  <div className={styles.formLabel}>
                    <span>{t.bans_modal_label_user}</span>
                  </div>

                  {/* Registered Users Search & List */}
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder={t.bans_modal_user_search}
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                    />
                  </div>

                  {filteredUsers.length > 0 && (
                    <div className={styles.userSelectBox}>
                      {filteredUsers.map((u) => {
                        const isSelected = selectedUser?.id === u.id;
                        return (
                          <div
                            key={u.id}
                            className={`${styles.userOption} ${isSelected ? styles.userOptionSelected : ""}`}
                            onClick={() => handleSelectUser(u)}
                          >
                            <div>
                              <strong style={{ display: "block" }}>
                                {u.username ? `@${u.username}` : u.fullName || "User"}
                              </strong>
                              <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                                {u.email || u.phone || u.id}
                              </span>
                            </div>
                            {isSelected && <CheckCircle2 size={16} color="#ef4444" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                      {lang === "bn" ? "অথবা সরাসরি ইউজার আইডি / ইমেইল লিখুন:" : "Or enter user email / ID directly:"}
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder={lang === "bn" ? "যেমন: user@example.com বা UUID" : "e.g. user@example.com or UUID"}
                      value={targetInput}
                      onChange={(e) => {
                        setTargetInput(e.target.value);
                        setSelectedUser(null);
                      }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t.bans_modal_reason_label}</label>
                <select
                  className={styles.formSelect}
                  value={reasonPreset}
                  onChange={(e) => setReasonPreset(e.target.value)}
                >
                  {reasonPresets.map((p, idx) => (
                    <option key={idx} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {(reasonPreset.startsWith("Custom Reason") || reasonPreset.includes("অন্যান্য")) && (
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ marginTop: 8 }}
                    placeholder={t.bans_modal_custom_reason_placeholder}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Duration */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t.bans_modal_duration_label}</label>
                <select
                  className={styles.formSelect}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as any)}
                >
                  <option value="PERMANENT">♾️ {t.bans_modal_duration_permanent}</option>
                  <option value="24H">⏱️ {t.bans_modal_duration_24h}</option>
                  <option value="7D">📅 {t.bans_modal_duration_7d}</option>
                  <option value="30D">🗓️ {t.bans_modal_duration_30d}</option>
                  <option value="CUSTOM">📆 {t.bans_modal_duration_custom}</option>
                </select>

                {duration === "CUSTOM" && (
                  <input
                    type="datetime-local"
                    className={styles.formInput}
                    style={{ marginTop: 8 }}
                    value={customExpiresAt}
                    onChange={(e) => setCustomExpiresAt(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Notes */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t.bans_modal_notes_label}</label>
                <textarea
                  className={styles.formTextarea}
                  rows={2}
                  placeholder={t.bans_modal_notes_placeholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button type="submit" disabled={isPending} className={styles.submitBtn}>
                <ShieldAlert size={18} />
                <span>{isPending ? t.bans_modal_btn_submitting : t.bans_modal_btn_submit}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
