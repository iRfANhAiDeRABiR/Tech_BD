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

const REASON_PRESETS = [
  "Payment Fraud / ভুয়া ট্রানজেকশন আইডি প্রদান",
  "Spamming Fake Orders / একের পর এক ভুয়া অর্ডার",
  "Automated Bot / Scraping / স্ক্র্যাপিং বা বট অ্যাক্টিভিটি",
  "Abusive Behavior / কাস্টমার সাপোর্টে অশোভন আচরণ",
  "DDoS / Excessive Requests / অস্বাভাবিক রিকোয়েস্ট বন্যা",
  "Terms & Policy Violation / সাইট নীতিমালার স্পষ্ট লঙ্ঘন",
  "Custom Reason (অন্যান্য কারণ)",
];

export function AccessBansClient({
  initialBans,
  registeredUsers,
  recentIps = [],
  visitorIp = "127.0.0.1",
  initialTarget,
  initialType,
  initialReason,
}: AccessBansClientProps) {
  const [bans, setBans] = useState<AccessBanItem[]>(initialBans);
  const [activeView, setActiveView] = useState<"BANS" | "IP_TRACKER">("BANS");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IP" | "USER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "REVOKED" | "EXPIRED">("ALL");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [banType, setBanType] = useState<"IP" | "USER">(
    (initialType === "USER" ? "USER" : "IP") as "IP" | "USER"
  );
  const [targetInput, setTargetInput] = useState(initialTarget || "");
  const [selectedUser, setSelectedUser] = useState<RegisteredUserSummary | null>(null);
  const [userSearchText, setUserSearchText] = useState("");
  const [reasonPreset, setReasonPreset] = useState(initialReason || REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState("");
  const [duration, setDuration] = useState<"PERMANENT" | "24H" | "7D" | "30D" | "CUSTOM">("PERMANENT");
  const [customExpiresAt, setCustomExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

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
        setReasonPreset("Custom Reason (অন্যান্য কারণ)");
        setCustomReason(initialReason);
      }
      setShowModal(true);
    }
  }, [initialTarget, initialType, initialReason]);

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
      const matchName = (item.associatedName && item.associatedName.toLowerCase().includes(q)) || false;
      const matchEmail = (item.associatedEmail && item.associatedEmail.toLowerCase().includes(q)) || false;
      const matchAction = item.lastAction.toLowerCase().includes(q);
      const matchOrder = (item.orderNumber && item.orderNumber.toLowerCase().includes(q)) || false;
      return matchIp || matchName || matchEmail || matchAction || matchOrder;
    });
  }, [recentIps, searchQuery]);

  // Filter users inside modal
  const filteredUsers = useMemo(() => {
    if (!userSearchText.trim()) return registeredUsers.slice(0, 15);
    const q = userSearchText.toLowerCase();
    return registeredUsers
      .filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.fullName?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [registeredUsers, userSearchText]);

  // Handlers
  const handleGenerateRandomIp = () => {
    const octet1 = Math.floor(Math.random() * (223 - 11)) + 11;
    const octet2 = Math.floor(Math.random() * 255);
    const octet3 = Math.floor(Math.random() * 255);
    const octet4 = Math.floor(Math.random() * 254) + 1;
    setTargetInput(`${octet1}.${octet2}.${octet3}.${octet4}`);
  };

  const handleUseVisitorIp = () => {
    setTargetInput(visitorIp || "127.0.0.1");
  };

  const handleSelectUser = (u: RegisteredUserSummary) => {
    setSelectedUser(u);
    setTargetInput(u.email || u.id);
  };

  const handleCopyIp = async (ipText: string) => {
    try {
      await navigator.clipboard.writeText(ipText);
      setCopiedIp(ipText);
      setTimeout(() => setCopiedIp(null), 2000);
    } catch {}
  };

  const handleQuickBanIp = (item: RecentIpActivityItem) => {
    setBanType("IP");
    setTargetInput(item.ip);
    setNotes(
      item.orderNumber
        ? `সন্দেহজনক অর্ডার #${item.orderNumber} (${item.associatedName || item.associatedEmail || ""})`
        : item.lastAction
    );
    setReasonPreset(
      item.orderNumber
        ? "Payment Fraud / ভুয়া ট্রানজেকশন আইডি প্রদান"
        : "Automated Bot / Scraping / স্ক্র্যাপিং বা বট অ্যাক্টিভিটি"
    );
    setShowModal(true);
  };

  const handleSubmitBan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const targetVal = targetInput.trim();
    if (!targetVal) {
      setFormError("অনুগ্রহ করে আইপি ঠিকানা বা ব্যবহারকারীর তথ্য দিন।");
      return;
    }

    const finalReason =
      reasonPreset === "Custom Reason (অন্যান্য কারণ)"
        ? customReason.trim() || "Policy violation"
        : reasonPreset;

    const formData = new FormData();
    formData.set("type", banType);
    formData.set("target", targetVal);
    formData.set("reason", finalReason);
    formData.set("notes", notes.trim());
    formData.set("duration", duration);
    if (duration === "CUSTOM" && customExpiresAt) {
      formData.set("customExpiresAt", customExpiresAt);
    }

    if (banType === "USER" && selectedUser) {
      formData.set("targetUserId", selectedUser.id);
      if (selectedUser.email) formData.set("targetEmail", selectedUser.email);
      if (selectedUser.phone) formData.set("targetPhone", selectedUser.phone);
      if (selectedUser.username) formData.set("targetUsername", selectedUser.username);
    } else if (banType === "USER") {
      if (targetVal.includes("@")) {
        formData.set("targetEmail", targetVal);
      }
    }

    startTransition(async () => {
      try {
        await createBanAction(formData);
        setShowModal(false);
        resetForm();
      } catch (err: any) {
        setFormError(err.message || "ব্যান তৈরি করতে সমস্যা হয়েছে।");
      }
    });
  };

  const resetForm = () => {
    setTargetInput("");
    setSelectedUser(null);
    setUserSearchText("");
    setReasonPreset(REASON_PRESETS[0]);
    setCustomReason("");
    setDuration("PERMANENT");
    setCustomExpiresAt("");
    setNotes("");
    setFormError(null);
  };

  const handleRevoke = (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই ব্যানটি তুলে নিতে (Revoke) চান?")) return;
    startTransition(async () => {
      await revokeBanAction(id);
      setBans((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: false } : b))
      );
    });
  };

  const handleReactivate = (id: string) => {
    if (!confirm("আপনি কি এই ব্যানটি পুনরায় সক্রিয় করতে চান?")) return;
    startTransition(async () => {
      await reactivateBanAction(id);
      setBans((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: true } : b))
      );
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("এই ব্যান রেকর্ডটি সম্পূর্ণ ডিলিট করে দিতে চান?")) return;
    startTransition(async () => {
      await deleteBanAction(id);
      setBans((prev) => prev.filter((b) => b.id !== id));
    });
  };

  return (
    <div>
      {/* ── Top Header ── */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headerTitle}>
            <ShieldAlert size={26} color="#ef4444" />
            <span>অ্যাক্সেস কন্ট্রোল, ব্যান ও আইপি ট্র্যাকার</span>
          </h1>
          <p className={styles.headerSubtitle}>
            সাইটের নিরাপত্তা ও ফ্রড রোধে অর্ডার ও ভিজিটরদের আইপি অ্যাড্রেস শনাক্ত করুন এবং যেকোনো আইপি বা রেজিস্টার্ড অ্যাকাউন্টকে ১-ক্লিকে ব্যান করুন।
          </p>
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
          <span>নতুন ব্যান যুক্ত করুন</span>
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
            <Lock size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>সক্রিয় ব্যান</span>
            <span className={styles.statValue}>{stats.activeCount}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <Globe size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>আইপি ব্যান</span>
            <span className={styles.statValue}>{stats.ipCount}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <UserX size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>ইউজার ব্যান</span>
            <span className={styles.statValue}>{stats.userCount}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "rgba(14, 165, 233, 0.15)", color: "#38bdf8" }}>
            <Radar size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>শনাক্তকৃত সাম্প্রতিক আইপি</span>
            <span className={styles.statValue}>{recentIps.length}</span>
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
          <span>বর্তমান ব্যান তালিকা ({bans.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.mainViewTabBtn} ${activeView === "IP_TRACKER" ? styles.mainViewTabBtnActive : ""}`}
          onClick={() => setActiveView("IP_TRACKER")}
        >
          <Radar size={16} />
          <span>🔍 সাম্প্রতিক ভিজিটর ও অর্ডার আইপি ট্র্যাকার ({recentIps.length})</span>
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
                placeholder="আইপি, ইমেইল, ইউজারনেম বা কারণ খুঁজুন..."
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
                  সবগুলো
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${typeFilter === "IP" ? styles.filterBtnActive : ""}`}
                  onClick={() => setTypeFilter("IP")}
                >
                  🌐 আইপি ব্যান
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${typeFilter === "USER" ? styles.filterBtnActive : ""}`}
                  onClick={() => setTypeFilter("USER")}
                >
                  👤 ইউজার ব্যান
                </button>
              </div>

              {/* Status Filter */}
              <div className={styles.filterTabs}>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${statusFilter === "ALL" ? styles.filterBtnActive : ""}`}
                  onClick={() => setStatusFilter("ALL")}
                >
                  সকল অবস্থা
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${statusFilter === "ACTIVE" ? styles.filterBtnActive : ""}`}
                  onClick={() => setStatusFilter("ACTIVE")}
                >
                  সক্রিয়
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${statusFilter === "REVOKED" ? styles.filterBtnActive : ""}`}
                  onClick={() => setStatusFilter("REVOKED")}
                >
                  স্থগিত বাতিল (Revoked)
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
                    <th>লক্ষ্যবস্তু (Target)</th>
                    <th>ব্যান টাইপ</th>
                    <th>কারণ ও নোট</th>
                    <th>মেয়াদকাল (Duration)</th>
                    <th>হিট সংখ্যা</th>
                    <th>তারিখ ও বাই</th>
                    <th>স্ট্যাটাস</th>
                    <th>অ্যাকশন</th>
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
                                      title="আইপি কপি করুন"
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
                                  {new Date(ban.expiresAt).toLocaleDateString("bn-BD", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span style={{ fontSize: "0.74rem", color: isExpired ? "#ef4444" : "var(--text-secondary)" }}>
                                  {isExpired ? "মেয়াদোত্তীর্ণ (Expired)" : "নির্দিষ্ট মেয়াদী"}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ef4444" }}>
                                স্থায়ী (Permanent)
                              </span>
                            )}
                          </td>

                          {/* Hit Count */}
                          <td>
                            <span className={styles.hitCounter}>
                              <AlertTriangle size={12} />
                              {ban.hitCount || 0}
                            </span>
                          </td>

                          {/* Date & Admin */}
                          <td>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                              <div>{new Date(ban.createdAt).toLocaleDateString()}</div>
                              <div>বাই: {ban.bannedBy || "Admin"}</div>
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            {isEffectiveActive ? (
                              <span className={`${styles.badge} ${styles.badgeActive}`}>
                                ● সক্রিয় (Banned)
                              </span>
                            ) : isExpired ? (
                              <span className={`${styles.badge} ${styles.badgeExpired}`}>
                                মেয়াদ শেষ
                              </span>
                            ) : (
                              <span className={`${styles.badge} ${styles.badgeRevoked}`}>
                                ✓ প্রত্যাহারকৃত (Revoked)
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td>
                            <div className={styles.actionBtns}>
                              {isEffectiveActive ? (
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => handleRevoke(ban.id)}
                                  disabled={isPending}
                                  title="ব্যান তুলে নিন"
                                >
                                  আনব্যান
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.actionBtnReactivate}`}
                                  onClick={() => handleReactivate(ban.id)}
                                  disabled={isPending}
                                  title="পুনরায় সক্রিয় করুন"
                                >
                                  পুনঃসক্রিয়
                                </button>
                              )}

                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                onClick={() => handleDelete(ban.id)}
                                disabled={isPending}
                                title="রেকর্ড মুছে ফেলুন"
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
                          <h4>কোনো ব্যান রেকর্ড পাওয়া যায়নি</h4>
                          <p>নতুন আইপি বা অ্যাকাউন্ট ব্যান করতে উপরের বাটনে ক্লিক করুন অথবা "আইপি ট্র্যাকার" ট্যাব থেকে শনাক্ত করুন।</p>
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

      {/* ── View 2: Recent IP Tracker & Suspects ── */}
      {activeView === "IP_TRACKER" && (
        <>
          <div className={styles.controlsRow}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="আইপি, গ্রাহকের নাম, ইমেইল বা অর্ডার নম্বর দিয়ে খুঁজুন..."
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
                    <th>আইপি অ্যাড্রেস (Visitor IP)</th>
                    <th>সম্পৃক্ত গ্রাহক / ইউজার</th>
                    <th>সাম্প্রতিক কর্মকাণ্ড (Activity Context)</th>
                    <th>কার্যকলাপ সংখ্যা</th>
                    <th>সর্বশেষ উপস্থিতি</th>
                    <th>বর্তমান অবস্থা</th>
                    <th>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecentIps.length > 0 ? (
                    filteredRecentIps.map((item, idx) => (
                      <tr key={idx}>
                        {/* IP */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className={styles.targetValue}>{item.displayIp || item.ip}</span>
                            <button
                              type="button"
                              className={styles.copyCodeBtn}
                              onClick={() => handleCopyIp(item.ip)}
                              title="আইপি কপি করুন"
                            >
                              {copiedIp === item.ip ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>

                        {/* Associated User */}
                        <td>
                          <div>
                            {item.associatedName || item.associatedEmail ? (
                              <>
                                <strong style={{ display: "block", fontSize: "0.88rem" }}>
                                  {item.associatedName || "Customer"}
                                </strong>
                                {item.associatedEmail && (
                                  <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                                    {item.associatedEmail}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                ভিজিটর (Guest)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Activity */}
                        <td>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text-primary)" }}>
                              {item.lastAction}
                            </span>
                            {item.orderNumber && (
                              <div style={{ marginTop: 2 }}>
                                <Link
                                  href={`/admin/orders?q=${encodeURIComponent(item.orderNumber)}`}
                                  style={{ fontSize: "0.76rem", color: "#6366f1", textDecoration: "underline" }}
                                >
                                  অর্ডার দেখুন ↗
                                </Link>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Count */}
                        <td>
                          <span style={{ fontSize: "0.84rem", fontWeight: 700 }}>
                            {item.count} বার
                          </span>
                        </td>

                        {/* Last Seen */}
                        <td>
                          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                            {new Date(item.lastSeenAt).toLocaleString("bn-BD", {
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
                              ● ব্যান করা আছে (Banned)
                            </span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeAllowed}`}>
                              ✓ স্বাভাবিক (Allowed)
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td>
                          {item.isBanned ? (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => {
                                if (item.banId) handleRevoke(item.banId);
                              }}
                            >
                              আনব্যান
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.quickBanBtn}
                              onClick={() => handleQuickBanIp(item)}
                            >
                              <ShieldAlert size={13} />
                              <span>🚫 Ban This IP</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <div className={styles.emptyState}>
                          <Radar size={40} style={{ opacity: 0.4 }} />
                          <h4>কোনো আইপি রেকর্ড পাওয়া যায়নি</h4>
                          <p>গ্রাহক যখনই ওয়েবসাইট ভিজিট বা কোনো অর্ডার সম্পন্ন করবে, তাদের আইপি স্বয়ংক্রিয়ভাবে এখানে তালিকাভুক্ত হবে।</p>
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
                  <h3 className={styles.modalTitle}>নতুন অ্যাক্সেস ব্যান যুক্ত করুন</h3>
                  <p className={styles.modalSubtitle}>নির্দিষ্ট আইপি বা ব্যবহারকারীকে সাইটে ঢুকতে বাধা দিন</p>
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
                <span>আইপি অ্যাড্রেস ব্যান (IP)</span>
              </button>

              <button
                type="button"
                className={`${styles.typeTabBtn} ${banType === "USER" ? styles.typeTabBtnActive : ""}`}
                onClick={() => {
                  setBanType("USER");
                }}
              >
                <UserX size={16} />
                <span>ইউজার অ্যাকাউন্ট ব্যান (User)</span>
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
                    <span>টার্গেট আইপি অ্যাড্রেস (Target IP)</span>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        className={styles.quickActionLink}
                        onClick={handleUseVisitorIp}
                      >
                        আমার আইপি দিন ({visitorIp})
                      </button>
                      <button
                        type="button"
                        className={styles.quickActionLink}
                        onClick={handleGenerateRandomIp}
                      >
                        🎲 র‍্যান্ডম আইপি বানান
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="যেমন: 203.0.113.45 বা 192.168.1.0/24"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                    একক আইপি (IPv4/IPv6) অথবা সাবনেট সিআইডিআর রেঞ্জ দেওয়া যাবে।
                  </span>
                </div>
              ) : (
                /* User Input */
                <div className={styles.formGroup}>
                  <div className={styles.formLabel}>
                    <span>টার্গেট ব্যবহারকারী (Select Registered User)</span>
                  </div>

                  {/* Registered Users Search & List */}
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="রেজিস্টার্ড ইউজারদের মধ্য থেকে খুঁজুন (ইমেইল/নাম)..."
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
                      অথবা সরাসরি ইউজার আইডি / ইমেইল লিখুন:
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="যেমন: user@example.com বা UUID"
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
                <label className={styles.formLabel}>স্থগিতকরণের কারণ (Reason)</label>
                <select
                  className={styles.formSelect}
                  value={reasonPreset}
                  onChange={(e) => setReasonPreset(e.target.value)}
                >
                  {REASON_PRESETS.map((p, idx) => (
                    <option key={idx} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {reasonPreset === "Custom Reason (অন্যান্য কারণ)" && (
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ marginTop: 8 }}
                    placeholder="কাস্টম কারণ বিস্তারিত লিখুন..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Duration */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>মেয়াদকাল (Duration)</label>
                <select
                  className={styles.formSelect}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as any)}
                >
                  <option value="PERMANENT">♾️ স্থায়ী ব্যান (Permanent - Never expires)</option>
                  <option value="24H">⏱️ ২৪ ঘণ্টা (24 Hours)</option>
                  <option value="7D">📅 ৭ দিন (7 Days)</option>
                  <option value="30D">🗓️ ৩০ দিন (30 Days)</option>
                  <option value="CUSTOM">📆 নির্দিষ্ট তারিখ নির্ধারণ করুন (Custom Date)</option>
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
                <label className={styles.formLabel}>অ্যাডমিন নোট (অভ্যন্তরীণ ব্যাখ্যার জন্য)</label>
                <textarea
                  className={styles.formTextarea}
                  rows={2}
                  placeholder="যেমন: বারবার বিকাশ ট্রানজেকশনে ভুয়া স্ক্রিনশট সাবমিট করেছে..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button type="submit" disabled={isPending} className={styles.submitBtn}>
                <ShieldAlert size={18} />
                <span>{isPending ? "ব্যান প্রয়োগ করা হচ্ছে..." : "ব্যান নিশ্চিত ও কার্যকর করুন"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
