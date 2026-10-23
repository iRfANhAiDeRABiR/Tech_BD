"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  TicketPercent,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { CouponItem, CouponDiscountType } from "@/lib/coupons-store";
import {
  createCouponAction,
  updateCouponAction,
  toggleCouponActiveAction,
  deleteCouponAction,
} from "@/app/admin/actions";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import styles from "./Coupons.module.css";

interface CouponsClientProps {
  initialCoupons: CouponItem[];
}

export function CouponsClient({ initialCoupons }: CouponsClientProps) {
  const { lang } = useAdminLanguage();
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number | "">(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | "">(0);
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [description, setDescription] = useState("");

  // Statistics
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive).length;
    const inactive = total - active;
    const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    return { total, active, inactive, totalUses };
  }, [coupons]);

  // Filtered List
  const filteredCoupons = useMemo(() => {
    let list = [...coupons];
    if (statusFilter === "active") {
      list = list.filter((c) => c.isActive);
    } else if (statusFilter === "inactive") {
      list = list.filter((c) => !c.isActive);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter(
        (c) =>
          c.code.includes(q) ||
          (c.description && c.description.toUpperCase().includes(q))
      );
    }
    return list;
  }, [coupons, statusFilter, searchQuery]);

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Ignore
    }
  };

  // Quick Active / Inactive Switch
  const handleToggleActive = (coupon: CouponItem) => {
    const nextState = !coupon.isActive;

    // Optimistic UI Update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextState } : c))
    );

    startTransition(async () => {
      try {
        await toggleCouponActiveAction(coupon.id, nextState);
      } catch (err) {
        // Rollback on failure
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !nextState } : c))
        );
        alert("Failed to update coupon status.");
      }
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setDiscountType("PERCENTAGE");
    setDiscountValue(10);
    setMinOrderAmount(0);
    setMaxDiscount("");
    setIsActive(true);
    setExpiresAt("");
    setUsageLimit("");
    setDescription("");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMinOrderAmount(coupon.minOrderAmount);
    setMaxDiscount(coupon.maxDiscount ?? "");
    setIsActive(coupon.isActive);
    setExpiresAt(coupon.expiresAt ? coupon.expiresAt.substring(0, 10) : "");
    setUsageLimit(coupon.usageLimit ?? "");
    setDescription(coupon.description || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Modal Form
  const handleSubmitModal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setFormError("Coupon code is required.");
      return;
    }

    if (discountValue === "" || Number(discountValue) < 0) {
      setFormError("Please enter a valid discount value.");
      return;
    }

    const formData = new FormData();
    if (editingCoupon) {
      formData.set("id", editingCoupon.id);
    }
    formData.set("code", cleanCode);
    formData.set("discountType", discountType);
    formData.set("discountValue", String(discountValue));
    formData.set("minOrderAmount", String(minOrderAmount || 0));
    if (maxDiscount !== "") formData.set("maxDiscount", String(maxDiscount));
    formData.set("isActive", isActive ? "true" : "false");
    if (expiresAt) formData.set("expiresAt", expiresAt);
    if (usageLimit !== "") formData.set("usageLimit", String(usageLimit));
    if (description.trim()) formData.set("description", description.trim());

    startTransition(async () => {
      try {
        if (editingCoupon) {
          await updateCouponAction(formData);
          setCoupons((prev) =>
            prev.map((c) =>
              c.id === editingCoupon.id
                ? {
                    ...c,
                    code: cleanCode,
                    discountType,
                    discountValue: Number(discountValue),
                    minOrderAmount: Number(minOrderAmount || 0),
                    maxDiscount: maxDiscount !== "" ? Number(maxDiscount) : null,
                    isActive,
                    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
                    usageLimit: usageLimit !== "" ? Number(usageLimit) : null,
                    description: description.trim() || null,
                  }
                : c
            )
          );
        } else {
          await createCouponAction(formData);
          // Insert placeholder while revalidation happens
          const newCoupon: CouponItem = {
            id: `temp-${Date.now()}`,
            code: cleanCode,
            discountType,
            discountValue: Number(discountValue),
            minOrderAmount: Number(minOrderAmount || 0),
            maxDiscount: maxDiscount !== "" ? Number(maxDiscount) : null,
            isActive,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
            usageLimit: usageLimit !== "" ? Number(usageLimit) : null,
            usedCount: 0,
            description: description.trim() || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCoupons((prev) => [newCoupon, ...prev]);
        }
        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err?.message || "Failed to save coupon.");
      }
    });
  };

  // Delete Coupon
  const handleDeleteCoupon = (coupon: CouponItem) => {
    if (!confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) return;

    setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));

    startTransition(async () => {
      try {
        await deleteCouponAction(coupon.id);
      } catch {
        alert("Failed to delete coupon.");
        setCoupons(initialCoupons);
      }
    });
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headerTitle}>
            <TicketPercent size={26} color="#10b981" />
            {lang === "bn" ? "ডিসকাউন্ট কুপন ম্যানেজমেন্ট" : "Discount Coupons"}
          </h1>
          <p className={styles.headerSubtitle}>
            {lang === "bn"
              ? "স্টোরের সক্রিয় ও নিষ্ক্রিয় কুপন কোড, ডিসকাউন্ট ও ব্যবহারের পরিমাণ পরিচালনা করুন।"
              : "Manage store discount coupons, toggle active/inactive states, and set redemption limits."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className={styles.primaryAddBtn}
        >
          <Plus size={18} />
          {lang === "bn" ? "নতুন কুপন যোগ করুন" : "Create Coupon"}
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}
          >
            <Tag size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>
              {lang === "bn" ? "মোট কুপন" : "Total Coupons"}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(34, 197, 94, 0.12)", color: "#22c55e" }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statLabel}>
              {lang === "bn" ? "সক্রিয় কুপন" : "Active Coupons"}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}
          >
            <XCircle size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.inactive}</div>
            <div className={styles.statLabel}>
              {lang === "bn" ? "নিষ্ক্রিয় কুপন" : "Inactive Coupons"}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.totalUses}</div>
            <div className={styles.statLabel}>
              {lang === "bn" ? "মোট ব্যবহার" : "Total Uses"}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={
              lang === "bn"
                ? "কুপন কোড বা বিবরণ দিয়ে খুঁজুন..."
                : "Search by coupon code or description..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterTab} ${statusFilter === "all" ? styles.filterTabActive : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            {lang === "bn" ? "সকল কুপন" : "All"} ({stats.total})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${statusFilter === "active" ? styles.filterTabActive : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            {lang === "bn" ? "সক্রিয়" : "Active"} ({stats.active})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${statusFilter === "inactive" ? styles.filterTabActive : ""}`}
            onClick={() => setStatusFilter("inactive")}
          >
            {lang === "bn" ? "নিষ্ক্রিয়" : "Inactive"} ({stats.inactive})
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className={styles.tableContainer}>
        {filteredCoupons.length === 0 ? (
          <div className={styles.emptyState}>
            <TicketPercent size={48} strokeWidth={1.5} />
            <h3 className={styles.emptyStateTitle}>
              {lang === "bn" ? "কোনো কুপন পাওয়া যায়নি" : "No coupons found"}
            </h3>
            <p>
              {searchQuery
                ? lang === "bn"
                  ? "আপনার সার্চ অনুসন্ধানের সাথে কোনো কুপন মেলেনি।"
                  : "No coupons match your search query."
                : lang === "bn"
                ? "নতুন কুপন কোড তৈরি করতে উপরের বাটনে ক্লিক করুন।"
                : "Click the 'Create Coupon' button to create your first coupon."}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{lang === "bn" ? "কুপন কোড" : "Coupon Code"}</th>
                <th>{lang === "bn" ? "ডিসকাউন্ট" : "Discount"}</th>
                <th>{lang === "bn" ? "শর্ত ও সীমা" : "Rules & Limits"}</th>
                <th>{lang === "bn" ? "মেয়াদ" : "Expiry"}</th>
                <th>{lang === "bn" ? "ব্যবহার" : "Usage"}</th>
                <th>{lang === "bn" ? "স্ট্যাটাস (Active / Inactive)" : "Active / Inactive"}</th>
                <th>{lang === "bn" ? "অ্যাকশন" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <div className={styles.codeBadgeWrap}>
                      <span className={styles.codeBadge}>{coupon.code}</span>
                      <button
                        type="button"
                        className={styles.copyCodeBtn}
                        onClick={() => handleCopyCode(coupon.code)}
                        title="Copy code"
                      >
                        {copiedCode === coupon.code ? (
                          <Check size={14} color="#10b981" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    {coupon.description && (
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-secondary)",
                          marginTop: 4,
                        }}
                      >
                        {coupon.description}
                      </div>
                    )}
                  </td>

                  <td>
                    <span className={styles.discountBadge}>
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}% OFF`
                        : `৳${coupon.discountValue.toLocaleString("en-BD")} OFF`}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: "0.82rem" }}>
                      {coupon.minOrderAmount > 0 ? (
                        <div>
                          Min Order: <strong>৳{coupon.minOrderAmount.toLocaleString("en-BD")}</strong>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-secondary)" }}>No minimum</span>
                      )}
                      {coupon.maxDiscount != null && (
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                          Max Discount: ৳{coupon.maxDiscount.toLocaleString("en-BD")}
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    {coupon.expiresAt ? (
                      <div style={{ fontSize: "0.82rem" }}>
                        {new Date(coupon.expiresAt).toLocaleDateString(
                          lang === "bn" ? "bn-BD" : "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                        {lang === "bn" ? "মেয়াদহীন" : "Lifetime"}
                      </span>
                    )}
                  </td>

                  <td>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                      {coupon.usedCount}
                      {coupon.usageLimit != null && (
                        <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                          {" "}/ {coupon.usageLimit}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    {/* The Core Active / Inactive Toggle Switch */}
                    <div className={styles.statusSwitchWrap}>
                      <label className={styles.switch} title="Toggle active / inactive">
                        <input
                          type="checkbox"
                          checked={coupon.isActive}
                          onChange={() => handleToggleActive(coupon)}
                        />
                        <span className={styles.slider} />
                      </label>
                      <span
                        className={
                          coupon.isActive
                            ? styles.statusTextActive
                            : styles.statusTextInactive
                        }
                      >
                        {coupon.isActive
                          ? lang === "bn"
                            ? "সক্রিয় (Active)"
                            : "Active"
                          : lang === "bn"
                          ? "নিষ্ক্রিয় (Inactive)"
                          : "Inactive"}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className={styles.actionBtns}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleOpenEditModal(coupon)}
                        title="Edit coupon"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={() => handleDeleteCoupon(coupon)}
                        title="Delete coupon"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <TicketPercent size={20} color="#10b981" />
                {editingCoupon
                  ? lang === "bn"
                    ? "কুপন সম্পাদনা করুন"
                    : "Edit Coupon"
                  : lang === "bn"
                  ? "নতুন কুপন যোগ করুন"
                  : "Create New Coupon"}
              </h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitModal}>
              {formError && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: 10,
                    color: "#ef4444",
                    fontSize: "0.85rem",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className={styles.formGrid}>
                {/* Coupon Code */}
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>
                    {lang === "bn" ? "কুপন কোড (যেমন: TECHBD10)" : "Coupon Code (e.g. TECHBD10)"} *
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="EID2026, SAVE10, RAMADAN..."
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className={styles.formLabel}>
                    {lang === "bn" ? "ডিসকাউন্টের ধরণ" : "Discount Type"}
                  </label>
                  <select
                    className={styles.formSelect}
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (৳ BDT)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className={styles.formLabel}>
                    {discountType === "PERCENTAGE"
                      ? lang === "bn"
                        ? "ডিসকাউন্ট (%) *"
                        : "Discount (%) *"
                      : lang === "bn"
                      ? "ডিসকাউন্ট (৳ BDT) *"
                      : "Discount (৳ BDT) *"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === "PERCENTAGE" ? "100" : undefined}
                    className={styles.formInput}
                    placeholder={discountType === "PERCENTAGE" ? "10" : "150"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                  />
                </div>

                {/* Min Order Amount */}
                <div>
                  <label className={styles.formLabel}>
                    {lang === "bn" ? "ন্যূনতম অর্ডার মূল্য (৳ BDT)" : "Minimum Order (৳ BDT)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={styles.formInput}
                    placeholder="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                {/* Max Discount Limit */}
                <div>
                  <label className={styles.formLabel}>
                    {lang === "bn" ? "সর্বোচ্চ ডিসকাউন্ট সীমা (৳ BDT)" : "Max Discount Limit (৳ BDT)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={styles.formInput}
                    placeholder={lang === "bn" ? "ঐচ্ছিক (যেমন: 500)" : "Optional (e.g. 500)"}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className={styles.formLabel}>
                    {lang === "bn" ? "মেয়াদ উত্তীর্ণের তারিখ" : "Expiry Date"}
                  </label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>

                {/* Usage Limit */}
                <div>
                  <label className={styles.formLabel}>
                    {lang === "bn" ? "ব্যবহারের সর্বোচ্চ সংখ্যা" : "Usage Limit"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={styles.formInput}
                    placeholder={lang === "bn" ? "ঐচ্ছিক (যেমন: 100)" : "Unlimited if empty"}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                {/* Description */}
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>
                    {lang === "bn" ? "কুপন বিবরণ / শর্তাবলী" : "Description / Notes"}
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder={lang === "bn" ? "যেমন: ১০% ডিসকাউন্ট পুরো স্টোরে" : "e.g. 10% off storewide"}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Active / Inactive Status Checkbox */}
              <label className={styles.formCheckboxGroup}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                  {lang === "bn"
                    ? "এই কুপনটি সক্রিয় (Active) হিসেবে সেভ করুন"
                    : "Mark this coupon as Active immediately"}
                </span>
              </label>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setIsModalOpen(false)}
                >
                  {lang === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.btnSubmit}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {lang === "bn" ? "সংরক্ষণ করা হচ্ছে..." : "Saving..."}
                    </>
                  ) : editingCoupon ? (
                    lang === "bn" ? "আপডেট করুন" : "Update Coupon"
                  ) : (
                    lang === "bn" ? "কুপন যোগ করুন" : "Create Coupon"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

