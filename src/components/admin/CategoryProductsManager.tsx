"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Star,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Check,
  CheckSquare,
  Square,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Sparkles,
  ArrowLeft,
  ListOrdered,
  Eye,
} from "lucide-react";
import {
  addProductsToCategoryQuickAction,
  removeProductFromCategoryQuickAction,
  saveCategoryProductOrderQuickAction,
} from "@/app/admin/actions";
import styles from "./CategoryProductsManager.module.css";

export interface CategoryProductItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  status: string;
  outOfStock: boolean;
  isFeatured?: boolean;
  sortOrder: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  accent?: string | null;
}

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
}

interface CategoryProductsManagerProps {
  category: CategoryItem;
  initialMemberProducts: CategoryProductItem[];
  initialAvailableProducts: CategoryProductItem[];
  allCategories: CategorySummary[];
  queryNotice?: {
    added?: string;
    ordered?: string;
    removed?: string;
  };
}

export function CategoryProductsManager({
  category,
  initialMemberProducts,
  initialAvailableProducts,
  allCategories,
  queryNotice,
}: CategoryProductsManagerProps) {
  const isTopSelling =
    category.id === 17 || category.slug.toLowerCase() === "top-selling";

  // Product lists state
  const [memberProducts, setMemberProducts] = useState<CategoryProductItem[]>(
    initialMemberProducts,
  );
  const [availableProducts, setAvailableProducts] = useState<
    CategoryProductItem[]
  >(initialAvailableProducts);

  // Selection state for available products
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sorting state for available products
  const [sortBy, setSortBy] = useState<
    | "default"
    | "name-asc"
    | "name-desc"
    | "price-asc"
    | "price-desc"
    | "category-asc"
    | "status-active"
  >("default");

  // Unsaved order state for member products
  const [unsavedOrder, setUnsavedOrder] = useState(false);

  // Loading transitions
  const [isPending, startTransition] = useTransition();
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  // Toast notice state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(() => {
    if (queryNotice?.added === "1") {
      return {
        type: "success",
        text: isTopSelling
          ? `Products featured in “${category.name}”.`
          : `Products copied to “${category.name}”.`,
      };
    }
    if (queryNotice?.ordered === "1") {
      return { type: "success", text: "Product order successfully updated." };
    }
    if (queryNotice?.removed === "1") {
      return {
        type: "success",
        text: isTopSelling
          ? `Product removed from “${category.name}”.`
          : `Product removed from category.`,
      };
    }
    if (queryNotice?.added === "0") {
      return { type: "error", text: "No products were selected." };
    }
    return null;
  });

  // Filtered & Sorted Available Products
  const filteredAvailableProducts = useMemo(() => {
    let list = [...availableProducts];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      );
    }

    // 2. Category Filter
    if (selectedCategory !== "all") {
      list = list.filter(
        (p) =>
          String(p.category.id) === selectedCategory ||
          p.category.slug.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // 3. Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "ACTIVE") {
        list = list.filter((p) => p.status === "ACTIVE");
      } else if (statusFilter === "OUT_OF_STOCK") {
        list = list.filter((p) => p.outOfStock);
      }
    }

    // 4. Sorting
    switch (sortBy) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "category-asc":
        list.sort((a, b) => a.category.name.localeCompare(b.category.name));
        break;
      case "status-active":
        list.sort((a, b) => {
          if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
          if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
          return a.name.localeCompare(b.name);
        });
        break;
      case "default":
      default:
        list.sort((a, b) => a.sortOrder - b.sortOrder);
        break;
    }

    return list;
  }, [availableProducts, searchQuery, selectedCategory, statusFilter, sortBy]);

  // Handle column header clicks for quick sorting
  const handleSortToggle = (field: "name" | "price" | "category" | "status") => {
    if (field === "name") {
      setSortBy((prev) => (prev === "name-asc" ? "name-desc" : "name-asc"));
    } else if (field === "price") {
      setSortBy((prev) => (prev === "price-asc" ? "price-desc" : "price-asc"));
    } else if (field === "category") {
      setSortBy((prev) => (prev === "category-asc" ? "default" : "category-asc"));
    } else if (field === "status") {
      setSortBy((prev) => (prev === "status-active" ? "default" : "status-active"));
    }
  };

  // Selection helpers
  const isAllFilteredSelected = useMemo(() => {
    if (!filteredAvailableProducts.length) return false;
    return filteredAvailableProducts.every((p) => selectedIds.has(p.id));
  }, [filteredAvailableProducts, selectedIds]);

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const next = new Set(selectedIds);
      filteredAvailableProducts.forEach((p) => next.delete(p.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredAvailableProducts.forEach((p) => next.add(p.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // ─────────────────────────────────────────────────────────────
  // Action: Single Product Add / Feature
  // ─────────────────────────────────────────────────────────────
  const handleFeatureSingle = async (product: CategoryProductItem) => {
    setLoadingProductId(product.id);
    startTransition(async () => {
      try {
        const res = await addProductsToCategoryQuickAction(category.id, [
          product.id,
        ]);
        if (res.success) {
          // Optimistically move product
          setAvailableProducts((prev) => prev.filter((p) => p.id !== product.id));
          setMemberProducts((prev) => [
            ...prev,
            { ...product, isFeatured: true, sortOrder: (prev.length + 1) * 10 },
          ]);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(product.id);
            return next;
          });
          setToast({
            type: "success",
            text: isTopSelling
              ? `“${product.name}” featured in Top Selling!`
              : `“${product.name}” copied to category!`,
          });
        } else {
          setToast({
            type: "error",
            text: res.error || "Failed to add product.",
          });
        }
      } catch (err: unknown) {
        setToast({
          type: "error",
          text: err instanceof Error ? err.message : "Error adding product.",
        });
      } finally {
        setLoadingProductId(null);
      }
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Action: Batch Add / Feature
  // ─────────────────────────────────────────────────────────────
  const handleBatchFeature = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    startTransition(async () => {
      try {
        const res = await addProductsToCategoryQuickAction(category.id, ids);
        if (res.success) {
          const selectedProducts = availableProducts.filter((p) =>
            selectedIds.has(p.id),
          );
          setAvailableProducts((prev) =>
            prev.filter((p) => !selectedIds.has(p.id)),
          );
          setMemberProducts((prev) => [
            ...prev,
            ...selectedProducts.map((p, idx) => ({
              ...p,
              isFeatured: true,
              sortOrder: (prev.length + idx + 1) * 10,
            })),
          ]);
          setSelectedIds(new Set());
          setToast({
            type: "success",
            text: isTopSelling
              ? `${selectedProducts.length} product(s) featured in Top Selling!`
              : `${selectedProducts.length} product(s) copied to category!`,
          });
        } else {
          setToast({
            type: "error",
            text: res.error || "Failed to batch add products.",
          });
        }
      } catch (err: unknown) {
        setToast({
          type: "error",
          text:
            err instanceof Error ? err.message : "Error adding selected products.",
        });
      }
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Action: Unfeature / Remove Single Product
  // ─────────────────────────────────────────────────────────────
  const handleRemoveMember = async (product: CategoryProductItem) => {
    setLoadingProductId(product.id);
    startTransition(async () => {
      try {
        const res = await removeProductFromCategoryQuickAction(
          category.id,
          product.id,
        );
        if (res.success) {
          setMemberProducts((prev) => prev.filter((p) => p.id !== product.id));
          setAvailableProducts((prev) => [
            { ...product, isFeatured: false },
            ...prev,
          ]);
          setToast({
            type: "success",
            text: isTopSelling
              ? `“${product.name}” removed from Top Selling.`
              : `“${product.name}” removed from category.`,
          });
        } else {
          setToast({
            type: "error",
            text: res.error || "Failed to remove product.",
          });
        }
      } catch (err: unknown) {
        setToast({
          type: "error",
          text:
            err instanceof Error ? err.message : "Error removing product.",
        });
      } finally {
        setLoadingProductId(null);
      }
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Ordering Helpers for Member Products (▲ ▼ ⏫ ⏬ Auto-Index)
  // ─────────────────────────────────────────────────────────────
  const moveMember = (index: number, direction: "up" | "down" | "top" | "bottom") => {
    if (index < 0 || index >= memberProducts.length) return;
    const items = [...memberProducts];

    if (direction === "up" && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === "down" && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    } else if (direction === "top") {
      const [item] = items.splice(index, 1);
      items.unshift(item);
    } else if (direction === "bottom") {
      const [item] = items.splice(index, 1);
      items.push(item);
    }

    // Auto-update sortOrder numbers sequentially based on position
    const updated = items.map((item, idx) => ({
      ...item,
      sortOrder: (idx + 1) * 10,
    }));

    setMemberProducts(updated);
    setUnsavedOrder(true);
  };

  const handleOrderInputChange = (id: string, newOrder: number) => {
    setMemberProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, sortOrder: newOrder } : item)),
    );
    setUnsavedOrder(true);
  };

  const handleAutoIndex = () => {
    setMemberProducts((prev) =>
      prev.map((item, idx) => ({
        ...item,
        sortOrder: (idx + 1) * 10,
      })),
    );
    setUnsavedOrder(true);
    setToast({
      type: "success",
      text: "Sequential serial numbers assigned (10, 20, 30...). Click 'Save Order' to commit.",
    });
  };

  const handleSaveOrder = async () => {
    startTransition(async () => {
      try {
        const updates = memberProducts.map((p) => ({
          id: p.id,
          sortOrder: p.sortOrder,
        }));
        const res = await saveCategoryProductOrderQuickAction(
          category.id,
          updates,
        );
        if (res.success) {
          setUnsavedOrder(false);
          setToast({
            type: "success",
            text: "Product display order saved successfully!",
          });
        } else {
          setToast({
            type: "error",
            text: res.error || "Failed to save product order.",
          });
        }
      } catch (err: unknown) {
        setToast({
          type: "error",
          text: err instanceof Error ? err.message : "Error saving order.",
        });
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER CARD WITH BREADCRUMB
          ───────────────────────────────────────────────────────────── */}
      <div className={styles.headerCard}>
        <div className={styles.breadcrumb}>
          <Link href="/admin">Management</Link>
          <span>/</span>
          <Link href="/admin/categories">Categories</Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{category.name}</span>
        </div>

        <div className={styles.headerMain}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>
                {isTopSelling
                  ? `Manage “${category.name}” Showcase`
                  : `Manage Products in “${category.name}”`}
              </h1>
              {isTopSelling ? (
                <span className={styles.topSellingBadge}>
                  <Star size={14} fill="#fbbf24" /> Top Selling
                </span>
              ) : (
                <span className={styles.categoryBadge}>
                  <Layers size={13} /> Category
                </span>
              )}
            </div>
            <p className={styles.subtitle}>
              {isTopSelling
                ? "Feature genuine store products here. Selected products appear immediately in the Top Selling section on the homepage and catalog without creating duplicate listings."
                : "Manage products inside this category or copy products from other categories."}
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link className={styles.backButton} href="/admin/categories">
              <ArrowLeft size={15} /> Back to Categories
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOAST ALERT BANNER
          ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`${styles.alertBanner} ${
            toast.type === "success" ? styles.alertSuccess : styles.alertError
          }`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            className={styles.alertCloseBtn}
            onClick={() => setToast(null)}
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. STATS CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>
              {isTopSelling ? "Featured Products" : "Category Products"}
            </span>
            <span className={styles.statValue}>{memberProducts.length}</span>
          </div>
          <div
            className={`${styles.statIcon} ${
              isTopSelling ? styles.statIconGold : ""
            }`}
          >
            {isTopSelling ? <Star size={22} fill="#fbbf24" /> : <Layers size={22} />}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Available to Add</span>
            <span className={styles.statValue}>{availableProducts.length}</span>
          </div>
          <div className={styles.statIcon}>
            <Plus size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Available in Store</span>
            <span className={styles.statValue}>
              {memberProducts.length + availableProducts.length}
            </span>
          </div>
          <div className={styles.statIcon}>
            <Eye size={22} />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SECTION 1: CURRENTLY FEATURED / MEMBER PRODUCTS
          ───────────────────────────────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>
              {isTopSelling ? (
                <>
                  <Star size={18} fill="#fbbf24" color="#fbbf24" /> Featured in
                  Top Selling
                </>
              ) : (
                <>
                  <Layers size={18} color="#38bdf8" /> Already in this category
                </>
              )}
              <span
                className={`${styles.countPill} ${
                  isTopSelling ? styles.countPillGold : ""
                }`}
              >
                {memberProducts.length}
              </span>
              {unsavedOrder && (
                <span className={styles.unsavedBadge}>
                  <AlertCircle size={12} /> Unsaved order changes
                </span>
              )}
            </h2>
            <p className={styles.sectionSubtitle}>
              Lower serial numbers appear first on the storefront. Use the ▲ / ▼
              buttons or click Auto-Index to order smoothly.
            </p>
          </div>

          {memberProducts.length > 0 && (
            <div className={styles.sectionActions}>
              <button
                className={styles.btnSecondary}
                onClick={handleAutoIndex}
                type="button"
                title="Automatically assign clean sequential serial numbers (10, 20, 30...)"
              >
                <ListOrdered size={15} /> Auto-Index
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSaveOrder}
                disabled={isPending || !unsavedOrder}
                type="button"
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={15} /> Save Order
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {memberProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Sparkles size={24} />
            </div>
            <h3 className={styles.emptyStateTitle}>
              {isTopSelling
                ? "No products currently featured in Top Selling"
                : "No products in this category yet"}
            </h3>
            <p className={styles.emptyStateText}>
              {isTopSelling
                ? "Select products from the list below to feature them on the storefront. You can customize their display order anytime."
                : "Choose products from the available catalog below to add them to this category."}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 130 }}>Display Order</th>
                  <th>Product</th>
                  <th>Original Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberProducts.map((product, idx) => (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.orderCell}>
                        <input
                          className={styles.orderInput}
                          type="number"
                          value={product.sortOrder}
                          onChange={(e) =>
                            handleOrderInputChange(
                              product.id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          aria-label={`Serial number for ${product.name}`}
                        />
                        <div className={styles.orderButtons}>
                          <button
                            className={styles.orderBtn}
                            onClick={() => moveMember(idx, "up")}
                            disabled={idx === 0}
                            title="Move Up"
                            type="button"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            className={styles.orderBtn}
                            onClick={() => moveMember(idx, "down")}
                            disabled={idx === memberProducts.length - 1}
                            title="Move Down"
                            type="button"
                          >
                            <ArrowDown size={11} />
                          </button>
                        </div>
                        <div className={styles.orderButtons}>
                          <button
                            className={styles.orderBtn}
                            onClick={() => moveMember(idx, "top")}
                            disabled={idx === 0}
                            title="Move to First"
                            type="button"
                          >
                            <ChevronsUp size={11} />
                          </button>
                          <button
                            className={styles.orderBtn}
                            onClick={() => moveMember(idx, "bottom")}
                            disabled={idx === memberProducts.length - 1}
                            title="Move to Last"
                            type="button"
                          >
                            <ChevronsDown size={11} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={42}
                            height={42}
                            className={styles.productThumb}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.productThumbPlaceholder}>📦</div>
                        )}
                        <div className={styles.productInfo}>
                          <span className={styles.productName}>
                            {product.name}
                          </span>
                          <span className={styles.productSlug}>
                            /{product.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.catPill}>
                        {product.category?.name ?? "General"}
                      </span>
                    </td>
                    <td className={styles.priceCell}>
                      ৳{product.price.toLocaleString("en-BD")}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          product.status === "ACTIVE"
                            ? styles.statusActive
                            : styles.statusDraft
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className={styles.btnUnfeature}
                        onClick={() => handleRemoveMember(product)}
                        disabled={loadingProductId === product.id || isPending}
                        type="button"
                        title={
                          isTopSelling
                            ? "Remove from Top Selling"
                            : "Remove from category"
                        }
                      >
                        {loadingProductId === product.id ? (
                          <Loader2 size={13} className="spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        <span>{isTopSelling ? "Unfeature" : "Remove"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION 2: AVAILABLE PRODUCTS TO ADD / FEATURE
          ───────────────────────────────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>
              {isTopSelling
                ? "Available products to feature"
                : "Available products"}
              <span className={styles.countPill}>
                {filteredAvailableProducts.length} of {availableProducts.length}
              </span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Use live search, category filters, and clickable column headers to
              quickly locate and feature products.
            </p>
          </div>

          {selectedIds.size > 0 && (
            <div className={styles.sectionActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setSelectedIds(new Set())}
                type="button"
              >
                Clear ({selectedIds.size})
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleBatchFeature}
                disabled={isPending}
                type="button"
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Star size={15} fill="#ffffff" />
                    {isTopSelling
                      ? `Feature Selected (${selectedIds.size})`
                      : `Add Selected (${selectedIds.size})`}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── TOOLBAR: SEARCH, FILTERS & PRODUCT SORTING ── */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarTop}>
            {/* Live Search */}
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, slug, or ID..."
              />
              {searchQuery && (
                <button
                  className={styles.searchClearBtn}
                  onClick={() => setSearchQuery("")}
                  type="button"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Controls: Category & Sort Dropdowns */}
            <div className={styles.toolbarControls}>
              {/* Category Dropdown */}
              <div className={styles.selectWrap}>
                <select
                  className={styles.selectInput}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>

              {/* Sort Dropdown */}
              <div className={styles.selectWrap}>
                <select
                  className={styles.selectInput}
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                        | "default"
                        | "name-asc"
                        | "name-desc"
                        | "price-asc"
                        | "price-desc"
                        | "category-asc"
                        | "status-active",
                    )
                  }
                >
                  <option value="default">Sort: Default Serial</option>
                  <option value="name-asc">Sort: Name (A to Z)</option>
                  <option value="name-desc">Sort: Name (Z to A)</option>
                  <option value="price-asc">Sort: Price (Low to High)</option>
                  <option value="price-desc">Sort: Price (High to Low)</option>
                  <option value="category-asc">Sort: Category (A to Z)</option>
                  <option value="status-active">Sort: Active First</option>
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>

              {/* Status Filter */}
              <div className={styles.selectWrap}>
                <select
                  className={styles.selectInput}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>
            </div>
          </div>

          {/* Quick Category Filter Pills */}
          <div className={styles.categoryPills}>
            <button
              className={`${styles.pillBtn} ${
                selectedCategory === "all" ? styles.pillBtnActive : ""
              }`}
              onClick={() => setSelectedCategory("all")}
              type="button"
            >
              All ({availableProducts.length})
            </button>
            {allCategories.map((c) => {
              const count = availableProducts.filter(
                (p) =>
                  p.category.id === c.id ||
                  p.category.slug.toLowerCase() === c.slug.toLowerCase(),
              ).length;
              if (count === 0) return null;
              return (
                <button
                  key={c.id}
                  className={`${styles.pillBtn} ${
                    selectedCategory === c.slug ? styles.pillBtnActive : ""
                  }`}
                  onClick={() => setSelectedCategory(c.slug)}
                  type="button"
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ── AVAILABLE PRODUCTS TABLE ── */}
        {filteredAvailableProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Search size={24} />
            </div>
            <h3 className={styles.emptyStateTitle}>No matching products found</h3>
            <p className={styles.emptyStateText}>
              Try adjusting your search query, clearing filters, or switching
              categories.
            </p>
            {(searchQuery || selectedCategory !== "all" || statusFilter !== "all") && (
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setStatusFilter("all");
                }}
                type="button"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "inherit",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title={
                        isAllFilteredSelected ? "Deselect All" : "Select All"
                      }
                      aria-label="Toggle select all"
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare size={16} color="#38bdf8" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th
                    className={styles.sortableHeader}
                    onClick={() => handleSortToggle("name")}
                    title="Click to sort by Name"
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span>Name</span>
                      {sortBy === "name-asc" ? (
                        <ArrowUp size={13} color="#38bdf8" />
                      ) : sortBy === "name-desc" ? (
                        <ArrowDown size={13} color="#38bdf8" />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.5} />
                      )}
                    </div>
                  </th>
                  <th
                    className={styles.sortableHeader}
                    onClick={() => handleSortToggle("category")}
                    title="Click to sort by Category"
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span>Category</span>
                      {sortBy === "category-asc" ? (
                        <ArrowUp size={13} color="#38bdf8" />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.5} />
                      )}
                    </div>
                  </th>
                  <th
                    className={styles.sortableHeader}
                    onClick={() => handleSortToggle("price")}
                    title="Click to sort by Price"
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span>Price</span>
                      {sortBy === "price-asc" ? (
                        <ArrowUp size={13} color="#38bdf8" />
                      ) : sortBy === "price-desc" ? (
                        <ArrowDown size={13} color="#38bdf8" />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.5} />
                      )}
                    </div>
                  </th>
                  <th
                    className={styles.sortableHeader}
                    onClick={() => handleSortToggle("status")}
                    title="Click to sort by Status"
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span>Status</span>
                      {sortBy === "status-active" ? (
                        <ArrowUp size={13} color="#38bdf8" />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.5} />
                      )}
                    </div>
                  </th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAvailableProducts.map((product) => {
                  const isChecked = selectedIds.has(product.id);
                  return (
                    <tr
                      key={product.id}
                      className={isChecked ? styles.rowSelected : ""}
                    >
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(product.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "inherit",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          aria-label={`Select ${product.name}`}
                        >
                          {isChecked ? (
                            <CheckSquare size={16} color="#38bdf8" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td>
                        <div className={styles.productCell}>
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={42}
                              height={42}
                              className={styles.productThumb}
                              unoptimized
                            />
                          ) : (
                            <div className={styles.productThumbPlaceholder}>
                              📦
                            </div>
                          )}
                          <div className={styles.productInfo}>
                            <span className={styles.productName}>
                              {product.name}
                            </span>
                            <span className={styles.productSlug}>
                              /{product.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.catPill}>
                          {product.category?.name ?? "General"}
                        </span>
                      </td>
                      <td className={styles.priceCell}>
                        ৳{product.price.toLocaleString("en-BD")}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            product.status === "ACTIVE"
                              ? styles.statusActive
                              : styles.statusDraft
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className={styles.btnFeatureOne}
                          onClick={() => handleFeatureSingle(product)}
                          disabled={
                            loadingProductId === product.id || isPending
                          }
                          type="button"
                          title={
                            isTopSelling
                              ? "Feature in Top Selling"
                              : "Copy to category"
                          }
                        >
                          {loadingProductId === product.id ? (
                            <Loader2 size={13} className="spin" />
                          ) : isTopSelling ? (
                            <Star size={13} fill="#38bdf8" />
                          ) : (
                            <Plus size={13} />
                          )}
                          <span>{isTopSelling ? "Feature" : "Add"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. STICKY FLOATING BATCH ACTION BAR
          ───────────────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className={styles.floatingBar}>
          <div className={styles.floatingSelectedCount}>
            <span className={styles.floatingBadge}>{selectedIds.size}</span>
            <span>products selected</span>
          </div>

          <div className={styles.floatingActions}>
            <button
              className={styles.floatingBtnCancel}
              onClick={() => setSelectedIds(new Set())}
              type="button"
            >
              Clear
            </button>
            <button
              className={styles.floatingBtnSubmit}
              onClick={handleBatchFeature}
              disabled={isPending}
              type="button"
            >
              {isPending ? (
                <>
                  <Loader2 size={15} className="spin" /> Processing...
                </>
              ) : (
                <>
                  <Star size={15} fill="#ffffff" />
                  {isTopSelling
                    ? `Feature ${selectedIds.size} in Top Selling`
                    : `Add ${selectedIds.size} to Category`}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

