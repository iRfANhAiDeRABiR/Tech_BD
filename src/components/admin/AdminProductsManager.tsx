"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  Grid,
  List,
  Sparkles,
  ArrowUpDown,
  Tag,
  Loader2,
} from "lucide-react";
import { deleteProductAction, toggleProductStockAction, toggleProductStatusAction } from "@/app/admin/actions";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import styles from "./AdminProductsManager.module.css";

export interface AdminProductItem {
  id: string;
  slug: string;
  name: string;
  badge?: string | null;
  price: number;
  originalPrice?: number | null;
  image: string;
  status: string;
  outOfStock: boolean;
  sortOrder: number;
  updatedAt?: string | Date;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  _count: {
    options: number;
  };
}

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
}

interface AdminProductsManagerProps {
  initialProducts: AdminProductItem[];
  categories: CategorySummary[];
}

export function AdminProductsManager({
  initialProducts,
  categories,
}: AdminProductsManagerProps) {
  const { lang, formatNumber, formatCurrency } = useAdminLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "DRAFT" | "ARCHIVED" | "OUT_OF_STOCK"
  >("ALL");
  const [sortBy, setSortBy] = useState<
    "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "options-desc" | "recent"
  >("default");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Delete confirmation modal state
  const [productToDelete, setProductToDelete] = useState<AdminProductItem | null>(null);

  // Optimistic toggling transitions
  const [isPending, startTransition] = useTransition();
  const [optimisticProducts, setOptimisticProducts] = useState(initialProducts);

  // Stats computation
  const stats = useMemo(() => {
    const total = initialProducts.length;
    const active = initialProducts.filter((p) => p.status === "ACTIVE" && !p.outOfStock).length;
    const outOfStock = initialProducts.filter((p) => p.outOfStock).length;
    const drafts = initialProducts.filter((p) => p.status === "DRAFT").length;
    const archived = initialProducts.filter((p) => p.status === "ARCHIVED").length;
    const catsCount = categories.length;

    return { total, active, outOfStock, drafts, archived, catsCount };
  }, [initialProducts, categories]);

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    let list = [...optimisticProducts];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.badge && p.badge.toLowerCase().includes(q)),
      );
    }

    // 2. Category Filter
    if (selectedCategory !== "all") {
      const catId = Number(selectedCategory);
      list = list.filter((p) => p.category.id === catId);
    }

    // 3. Status Filter
    if (statusFilter === "ACTIVE") {
      list = list.filter((p) => p.status === "ACTIVE" && !p.outOfStock);
    } else if (statusFilter === "OUT_OF_STOCK") {
      list = list.filter((p) => p.outOfStock);
    } else if (statusFilter === "DRAFT") {
      list = list.filter((p) => p.status === "DRAFT");
    } else if (statusFilter === "ARCHIVED") {
      list = list.filter((p) => p.status === "ARCHIVED");
    }

    // 4. Sorting
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "options-desc":
        list.sort((a, b) => b._count.options - a._count.options);
        break;
      case "recent":
        list.sort(
          (a, b) =>
            new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
        );
        break;
      default:
        list.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return list;
  }, [optimisticProducts, searchQuery, selectedCategory, statusFilter, sortBy]);

  // Quick Inline Toggle: Stock Status
  const handleToggleStock = (product: AdminProductItem) => {
    // Optimistic UI update
    setOptimisticProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, outOfStock: !p.outOfStock } : p)),
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.set("productId", product.id);
      await toggleProductStockAction(formData);
    });
  };

  // Quick Inline Toggle: Product Status (Active / Draft)
  const handleToggleStatus = (product: AdminProductItem) => {
    const nextStatus = product.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    setOptimisticProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p)),
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.set("productId", product.id);
      await toggleProductStatusAction(formData);
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setStatusFilter("ALL");
    setSortBy("default");
  };

  const isFiltering =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    statusFilter !== "ALL" ||
    sortBy !== "default";

  return (
    <div className={styles.container}>
      {/* ─────────────────────────────────────────────────────────────
          1. STATS OVERVIEW CARDS (Fast Track at a Glance)
         ───────────────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>
              {lang === "bn" ? "মোট প্রোডাক্ট" : "Total Products"}
            </span>
            <span className={styles.statValue}>{formatNumber(stats.total)}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <Package size={20} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>
              {lang === "bn" ? "স্টোরে সক্রিয়" : "Active in Store"}
            </span>
            <span className={styles.statValue}>{formatNumber(stats.active)}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>
              {lang === "bn" ? "স্টক আউট" : "Out of Stock"}
            </span>
            <span className={styles.statValue}>{formatNumber(stats.outOfStock)}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconAmber}`}>
            <AlertCircle size={20} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>
              {lang === "bn" ? "ক্যাটাগরি সমূহ" : "Categories"}
            </span>
            <span className={styles.statValue}>{formatNumber(stats.catsCount)}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <Layers size={20} />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SEARCH, FILTER & VIEW CONTROLS TOOLBAR
         ───────────────────────────────────────────────────────────── */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarTopRow}>
          {/* Live Search Input */}
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "bn"
                  ? "নাম, ক্যাটাগরি বা আইডি দিয়ে খুঁজুন..."
                  : "Search by name, category, or ID..."
              }
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={styles.searchClear}
                title={lang === "bn" ? "সার্চ মুছুন" : "Clear search"}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Right Control Group: Category, Sort, View Mode */}
          <div className={styles.filterControlsRight}>
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.selectDropdown}
              aria-label={lang === "bn" ? "ক্যাটাগরি ফিল্টার" : "Filter by category"}
            >
              <option value="all">
                {lang === "bn"
                  ? `সকল ক্যাটাগরি (${formatNumber(categories.length)})`
                  : `All Categories (${categories.length})`}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c._count?.products ? `(${formatNumber(c._count.products)})` : ""}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={styles.selectDropdown}
              aria-label={lang === "bn" ? "প্রোডাক্ট সাজান" : "Sort products"}
            >
              <option value="default">
                {lang === "bn" ? "ক্রমানুসার: ডিফল্ট" : "Sort: Order (Default)"}
              </option>
              <option value="price-asc">
                {lang === "bn" ? "মূল্য: কম থেকে বেশি" : "Price: Low to High"}
              </option>
              <option value="price-desc">
                {lang === "bn" ? "মূল্য: বেশি থেকে কম" : "Price: High to Low"}
              </option>
              <option value="name-asc">
                {lang === "bn" ? "নাম: A থেকে Z" : "Name: A to Z"}
              </option>
              <option value="name-desc">
                {lang === "bn" ? "নাম: Z থেকে A" : "Name: Z to A"}
              </option>
              <option value="options-desc">
                {lang === "bn" ? "সর্বোচ্চ ভ্যারিয়েন্ট/অপশন" : "Most Options"}
              </option>
              <option value="recent">
                {lang === "bn" ? "সম্প্রতি আপডেটকৃত" : "Recently Updated"}
              </option>
            </select>

            {/* View Mode Toggle: Table vs Grid */}
            <div className={styles.viewModeGroup}>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`${styles.viewModeBtn} ${
                  viewMode === "table" ? styles.viewModeBtnActive : ""
                }`}
                title={lang === "bn" ? "টেবিল ভিউ" : "Table list view"}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`${styles.viewModeBtn} ${
                  viewMode === "grid" ? styles.viewModeBtnActive : ""
                }`}
                title={lang === "bn" ? "গ্রিড কার্ড ভিউ" : "Grid card view"}
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs Row */}
        <div className={styles.statusTabsRow}>
          <div className={styles.statusTabs}>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`${styles.statusTabBtn} ${
                statusFilter === "ALL" ? styles.statusTabBtnActive : ""
              }`}
            >
              <span>{lang === "bn" ? "সব প্রোডাক্ট" : "All Products"}</span>
              <span className={styles.tabBadge}>{formatNumber(stats.total)}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`${styles.statusTabBtn} ${
                statusFilter === "ACTIVE" ? styles.statusTabBtnActive : ""
              }`}
            >
              <span>{lang === "bn" ? "সক্রিয়" : "Active"}</span>
              <span className={styles.tabBadge}>{formatNumber(stats.active)}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("OUT_OF_STOCK")}
              className={`${styles.statusTabBtn} ${
                statusFilter === "OUT_OF_STOCK" ? styles.statusTabBtnActive : ""
              }`}
            >
              <span>{lang === "bn" ? "স্টক আউট" : "Out of Stock"}</span>
              <span className={styles.tabBadge}>{formatNumber(stats.outOfStock)}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("DRAFT")}
              className={`${styles.statusTabBtn} ${
                statusFilter === "DRAFT" ? styles.statusTabBtnActive : ""
              }`}
            >
              <span>{lang === "bn" ? "ড্রাফট" : "Draft"}</span>
              <span className={styles.tabBadge}>{formatNumber(stats.drafts)}</span>
            </button>

            {stats.archived > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("ARCHIVED")}
                className={`${styles.statusTabBtn} ${
                  statusFilter === "ARCHIVED" ? styles.statusTabBtnActive : ""
                }`}
              >
                <span>{lang === "bn" ? "আর্কাইভড" : "Archived"}</span>
                <span className={styles.tabBadge}>{formatNumber(stats.archived)}</span>
              </button>
            )}
          </div>

          {/* Results Summary Count */}
          <div className={styles.resultsSummary}>
            {lang === "bn" ? (
              <>
                দেখানো হচ্ছে <strong>{formatNumber(filteredProducts.length)}</strong> /{" "}
                {formatNumber(initialProducts.length)} টি
              </>
            ) : (
              <>
                Showing <strong>{filteredProducts.length}</strong> of {initialProducts.length}
              </>
            )}
            {isFiltering && (
              <>
                {" "}
                {lang === "bn" ? "(ফিল্টারকৃত) " : "(filtered) "}
                <button type="button" onClick={resetFilters} className={styles.resetBtn}>
                  {lang === "bn" ? "রিসেট" : "Reset"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. PRODUCT LISTING: TABLE VIEW OR CARD GRID VIEW
         ───────────────────────────────────────────────────────────── */}
      {filteredProducts.length === 0 ? (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>
            <Package size={40} style={{ opacity: 0.4 }} />
            <div style={{ fontSize: "16px", fontWeight: 700 }}>
              {lang === "bn" ? "কোন প্রোডাক্ট পাওয়া যায়নি" : "No products found"}
            </div>
            <div style={{ fontSize: "13px" }}>
              {lang === "bn"
                ? "আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।"
                : "Try adjusting your search query or filter settings."}
            </div>
            {isFiltering && (
              <button
                type="button"
                onClick={resetFilters}
                className={styles.resetBtn}
                style={{ marginTop: "8px", fontSize: "13px" }}
              >
                {lang === "bn" ? "সকল ফিল্টার মুছুন" : "Clear all filters"}
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>{lang === "bn" ? "প্রোডাক্ট" : "Product"}</th>
                  <th>{lang === "bn" ? "ক্যাটাগরি" : "Category"}</th>
                  <th>{lang === "bn" ? "মূল্য" : "Price"}</th>
                  <th>{lang === "bn" ? "অপশন" : "Options"}</th>
                  <th>{lang === "bn" ? "স্টক" : "Stock"}</th>
                  <th>{lang === "bn" ? "স্ট্যাটাস" : "Status"}</th>
                  <th style={{ textAlign: "right" }}>{lang === "bn" ? "অ্যাকশন" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isActive = product.status === "ACTIVE";
                  const isOut = product.outOfStock;

                  return (
                    <tr key={product.id} className={styles.productRow}>
                      {/* Product Name + Image */}
                      <td className={styles.productCell}>
                        <div className={styles.productMetaCell}>
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={44}
                              height={44}
                              className={styles.productThumb}
                            />
                          ) : (
                            <div className={styles.productThumbFallback}>
                              <Package size={20} />
                            </div>
                          )}

                          <div className={styles.productNameCol}>
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className={styles.productNameLink}
                              prefetch={false}
                            >
                              {product.name}
                            </Link>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {product.badge && (
                                <span className={styles.badgePill}>{product.badge}</span>
                              )}
                              <span style={{ fontSize: "11px", color: "#64748b" }}>
                                #{product.slug || product.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className={styles.productCell}>
                        <span className={styles.categoryPill}>{product.category.name}</span>
                      </td>

                      {/* Price */}
                      <td className={styles.productCell}>
                        <div className={styles.priceCol}>
                          {formatCurrency(product.price)}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className={styles.originalPriceStrikethrough}>
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Options */}
                      <td className={styles.productCell}>
                        <span className={styles.optionsPill}>
                          <Tag size={11} />
                          <span>
                            {lang === "bn"
                              ? `${formatNumber(product._count.options)} টি অপশন`
                              : `${product._count.options} ${
                                  product._count.options === 1 ? "Option" : "Options"
                                }`}
                          </span>
                        </span>
                      </td>

                      {/* Quick Stock Toggle */}
                      <td className={styles.productCell}>
                        <button
                          type="button"
                          onClick={() => handleToggleStock(product)}
                          className={`${styles.stockToggleBtn} ${
                            isOut ? styles.stockOut : styles.stockIn
                          }`}
                          title={
                            lang === "bn"
                              ? "স্টক স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                              : "Click to toggle Stock Status"
                          }
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: isOut ? "#ef4444" : "#10b981",
                            }}
                          />
                          <span>
                            {isOut
                              ? lang === "bn"
                                ? "স্টক আউট"
                                : "Out of Stock"
                              : lang === "bn"
                              ? "স্টকে আছে"
                              : "In Stock"}
                          </span>
                        </button>
                      </td>

                      {/* Quick Status Toggle (Active / Draft) */}
                      <td className={styles.productCell}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(product)}
                          className={`${styles.stockToggleBtn} ${
                            isActive ? styles.stockIn : styles.stockOut
                          }`}
                          title={
                            lang === "bn"
                              ? "সক্রিয় / ড্রাফট স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                              : "Click to toggle Active / Draft status"
                          }
                        >
                          <span>
                            {product.status === "ACTIVE"
                              ? lang === "bn"
                                ? "সক্রিয়"
                                : "ACTIVE"
                              : lang === "bn"
                              ? "ড্রাফট"
                              : product.status}
                          </span>
                        </button>
                      </td>

                      {/* Fast Actions: Edit, View Live, Delete */}
                      <td className={styles.productCell} style={{ textAlign: "right" }}>
                        <div
                          className={styles.actionsGroup}
                          style={{ justifyContent: "flex-end" }}
                        >
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className={styles.btnActionEdit}
                            title={lang === "bn" ? "প্রোডাক্ট এডিট করুন" : "Edit product details"}
                            prefetch={false}
                          >
                            <Edit2 size={12} />
                            <span>{lang === "bn" ? "এডিট" : "Edit"}</span>
                          </Link>

                          <Link
                            href={`/products/${product.slug || product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnActionPreview}
                            title={
                              lang === "bn"
                                ? "লাইভ স্টোরে প্রোডাক্ট দেখুন"
                                : "View product in live store"
                            }
                          >
                            <ExternalLink size={13} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className={styles.btnActionDelete}
                            title={
                              lang === "bn"
                                ? "প্রোডাক্ট মুছুন বা আর্কাইভ করুন"
                                : "Delete or archive product"
                            }
                          >
                            <Trash2 size={12} />
                            <span>{lang === "bn" ? "মুছুন" : "Delete"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARD VIEW */
        <div className={styles.gridCards}>
          {filteredProducts.map((product) => {
            const isOut = product.outOfStock;
            const isActive = product.status === "ACTIVE";

            return (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.cardTopRow}>
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={60}
                      height={60}
                      className={styles.cardThumb}
                    />
                  ) : (
                    <div
                      className={styles.productThumbFallback}
                      style={{ width: 60, height: 60 }}
                    >
                      <Package size={24} />
                    </div>
                  )}

                  <div className={styles.cardMeta}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span className={styles.categoryPill}>{product.category.name}</span>
                      {product.badge && (
                        <span className={styles.badgePill}>{product.badge}</span>
                      )}
                    </div>

                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className={styles.cardTitle}
                      prefetch={false}
                    >
                      {product.name}
                    </Link>

                    <div className={styles.priceCol}>
                      {formatCurrency(product.price)}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className={styles.originalPriceStrikethrough}>
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStock(product)}
                      className={`${styles.stockToggleBtn} ${
                        isOut ? styles.stockOut : styles.stockIn
                      }`}
                    >
                      {isOut
                        ? lang === "bn"
                          ? "স্টক আউট"
                          : "Out of Stock"
                        : lang === "bn"
                        ? "স্টকে আছে"
                        : "In Stock"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(product)}
                      className={`${styles.stockToggleBtn} ${
                        isActive ? styles.stockIn : styles.stockOut
                      }`}
                    >
                      {product.status === "ACTIVE"
                        ? lang === "bn"
                          ? "সক্রিয়"
                          : "ACTIVE"
                        : lang === "bn"
                        ? "ড্রাফট"
                        : product.status}
                    </button>
                  </div>

                  <div className={styles.actionsGroup}>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className={styles.btnActionEdit}
                      prefetch={false}
                      title={lang === "bn" ? "প্রোডাক্ট এডিট করুন" : "Edit product details"}
                    >
                      <Edit2 size={12} />
                      <span>{lang === "bn" ? "এডিট" : "Edit"}</span>
                    </Link>

                    <Link
                      href={`/products/${product.slug || product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnActionPreview}
                      title={
                        lang === "bn"
                          ? "লাইভ স্টোরে প্রোডাক্ট দেখুন"
                          : "View product in live store"
                      }
                    >
                      <ExternalLink size={13} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setProductToDelete(product)}
                      className={styles.btnActionDelete}
                      title={
                        lang === "bn"
                          ? "প্রোডাক্ট মুছুন বা আর্কাইভ করুন"
                          : "Delete or archive product"
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. DELETE CONFIRMATION MODAL
         ───────────────────────────────────────────────────────────── */}
      {productToDelete && (
        <div className={styles.modalBackdrop} onClick={() => setProductToDelete(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWarn}>
                <Trash2 size={20} />
              </div>
              <h3 className={styles.modalTitle}>
                {lang === "bn" ? "প্রোডাক্ট ডিলিট নিশ্চিত করুন" : "Confirm Delete Product"}
              </h3>
            </div>

            <p className={styles.modalBody}>
              {lang === "bn" ? (
                <>
                  আপনি কি নিশ্চিতভাবে <strong>{productToDelete.name}</strong> মুছতে চান?
                  <br />
                  <span style={{ fontSize: "12px", opacity: 0.8, marginTop: 4, display: "block" }}>
                    যদি এই আইটেমের পূর্ববর্তী কোনো অর্ডার থাকে, তবে কাস্টমার হিস্ট্রি রক্ষার জন্য
                    এটি নিরাপদে আর্কাইভ করা হবে।
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{productToDelete.name}</strong>?
                  <br />
                  <span style={{ fontSize: "12px", opacity: 0.8, marginTop: 4, display: "block" }}>
                    If this item has existing orders, it will be safely archived to preserve
                    customer records.
                  </span>
                </>
              )}
            </p>

            <form action={deleteProductAction} className={styles.modalActions}>
              <input type="hidden" name="productId" value={productToDelete.id} />
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className={styles.btnModalCancel}
              >
                {lang === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button type="submit" className={styles.btnModalDelete}>
                {lang === "bn" ? "প্রোডাক্ট মুছুন" : "Delete Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

