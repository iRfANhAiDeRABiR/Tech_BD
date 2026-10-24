"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Package,
  Plus,
  Edit2,
  Trash2,
  Grid,
  List,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import {
  saveCategoryAction,
  deleteCategoryAction,
  saveCategoryOrderAction,
  toggleCategoryStatusAction,
} from "@/app/admin/actions";
import { AVAILABLE_IMG_CONTENT } from "@/lib/available-images";
import { useAdminLanguage } from "@/context/AdminLanguageContext";
import styles from "./AdminCategoriesManager.module.css";

export interface AdminCategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  accent: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}

interface AdminCategoriesManagerProps {
  initialCategories: AdminCategoryItem[];
  notices?: {
    saved?: boolean;
    deleted?: boolean;
    ordered?: boolean;
  };
}

const COLOR_PRESETS = [
  { label: "Sky", color: "#0ea5e9" },
  { label: "Emerald", color: "#10b981" },
  { label: "Violet", color: "#8b5cf6" },
  { label: "Rose", color: "#f43f5e" },
  { label: "Amber", color: "#f59e0b" },
  { label: "Cyan", color: "#06b6d4" },
  { label: "Indigo", color: "#6366f1" },
  { label: "Slate", color: "#64748b" },
];

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function AdminCategoriesManager({
  initialCategories,
  notices,
}: AdminCategoriesManagerProps) {
  const { formatNumber } = useAdminLanguage();

  // Search, Filter & View States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortBy, setSortBy] = useState<
    "sortOrder" | "sortOrder-desc" | "name-asc" | "name-desc" | "products-desc" | "products-asc" | "recent"
  >("sortOrder");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Notifications
  const [showNotice, setShowNotice] = useState(
    Boolean(notices?.saved || notices?.deleted || notices?.ordered)
  );
  const noticeText = notices?.deleted
    ? "Category removed or deactivated successfully."
    : notices?.ordered
    ? "Category serial priority order updated."
    : "Category saved successfully.";

  // Optimistic Categories & Active Toggling
  const [optimisticCategories, setOptimisticCategories] = useState<AdminCategoryItem[]>(initialCategories);
  const [, startTransition] = useTransition();

  // Serial Orders Editing State
  const [sortOrders, setSortOrders] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    initialCategories.forEach((c) => {
      map[c.id] = c.sortOrder;
    });
    return map;
  });

  const modifiedCategoryIds = useMemo(() => {
    const modified: number[] = [];
    initialCategories.forEach((c) => {
      if (sortOrders[c.id] !== undefined && sortOrders[c.id] !== c.sortOrder) {
        modified.push(c.id);
      }
    });
    return modified;
  }, [initialCategories, sortOrders]);

  // Modal States
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<AdminCategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategoryItem | null>(null);

  // Form Field States for Create/Edit Modal
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formAccent, setFormAccent] = useState("#0ea5e9");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Stats computation
  const stats = useMemo(() => {
    const total = optimisticCategories.length;
    const active = optimisticCategories.filter((c) => c.isActive).length;
    const inactive = total - active;
    const totalProducts = optimisticCategories.reduce((acc, c) => acc + (c._count?.products || 0), 0);
    return { total, active, inactive, totalProducts };
  }, [optimisticCategories]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const nextOrder = Math.max(0, ...optimisticCategories.map((c) => c.sortOrder)) + 1;
    setCategoryToEdit(null);
    setFormName("");
    setFormSlug("");
    setFormAccent("#0ea5e9");
    setFormSortOrder(nextOrder);
    setFormDescription("");
    setFormImageUrl("");
    setFormIsActive(true);
    setModalMode("create");
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: AdminCategoryItem) => {
    setCategoryToEdit(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormAccent(cat.accent || "#0ea5e9");
    setFormSortOrder(cat.sortOrder);
    setFormDescription(cat.description || "");
    setFormImageUrl(cat.image || "");
    setFormIsActive(cat.isActive);
    setModalMode("edit");
  };

  // Auto-generate slug from name
  const handleAutoSlug = () => {
    if (formName.trim()) {
      setFormSlug(slugify(formName));
    }
  };

  // Handle Sort Order input change
  const handleSortOrderChange = (id: number, val: number) => {
    setSortOrders((prev) => ({
      ...prev,
      [id]: val,
    }));
  };

  // Reset Sort Order changes
  const handleResetSortOrders = () => {
    const map: Record<number, number> = {};
    initialCategories.forEach((c) => {
      map[c.id] = c.sortOrder;
    });
    setSortOrders(map);
  };

  // Optimistic Active Toggle
  const handleToggleStatus = (category: AdminCategoryItem) => {
    const nextActive = !category.isActive;
    startTransition(async () => {
      setOptimisticCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isActive: nextActive } : c))
      );
      const fd = new FormData();
      fd.append("categoryId", String(category.id));
      await toggleCategoryStatusAction(fd);
    });
  };

  // Filtered & Sorted Categories
  const filteredCategories = useMemo(() => {
    let list = [...optimisticCategories];

    // Status filter
    if (statusFilter === "ACTIVE") {
      list = list.filter((c) => c.isActive);
    } else if (statusFilter === "INACTIVE") {
      list = list.filter((c) => !c.isActive);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "sortOrder") {
        const orderA = sortOrders[a.id] ?? a.sortOrder;
        const orderB = sortOrders[b.id] ?? b.sortOrder;
        return orderA - orderB || a.name.localeCompare(b.name);
      }
      if (sortBy === "sortOrder-desc") {
        const orderA = sortOrders[a.id] ?? a.sortOrder;
        const orderB = sortOrders[b.id] ?? b.sortOrder;
        return orderB - orderA || a.name.localeCompare(b.name);
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "products-desc") {
        return (b._count?.products || 0) - (a._count?.products || 0);
      }
      if (sortBy === "products-asc") {
        return (a._count?.products || 0) - (b._count?.products || 0);
      }
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return list;
  }, [optimisticCategories, statusFilter, searchQuery, sortBy, sortOrders]);

  return (
    <div className={styles.container}>
      {/* 1. Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>
            Store Categories
            <span className={styles.titleBadge}>
              {formatNumber(optimisticCategories.length)} Categories
            </span>
          </h1>
          <p className={styles.subtitle}>
            Organize catalog structure, customize colors and banners, and set serial priority on the storefront.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={handleOpenCreateModal} type="button">
            <Plus size={16} />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Query notification alert */}
      {showNotice && (
        <div className={styles.noticeAlert}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={18} />
            <span>{noticeText}</span>
          </div>
          <button
            className={styles.closeNoticeBtn}
            onClick={() => setShowNotice(false)}
            aria-label="Close notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Top Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Categories</span>
            <span className={styles.statValue}>{formatNumber(stats.total)}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconSky}`}>
            <Layers size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Live</span>
            <span className={styles.statValue}>{formatNumber(stats.active)}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Hidden / Inactive</span>
            <span className={styles.statValue}>{formatNumber(stats.inactive)}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconAmber}`}>
            <EyeOff size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Assigned Products</span>
            <span className={styles.statValue}>{formatNumber(stats.totalProducts)}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <Package size={22} />
          </div>
        </div>
      </div>

      {/* 3. Sticky Unsaved Serial Order Bar */}
      {modifiedCategoryIds.length > 0 && (
        <div className={styles.orderBarSticky}>
          <div className={styles.orderBarText}>
            <AlertTriangle size={18} color="#f59e0b" />
            <span>
              You have modified the serial order of <strong>{modifiedCategoryIds.length}</strong> categories.
            </span>
          </div>
          <div className={styles.orderBarActions}>
            <button className={styles.btnResetOrder} onClick={handleResetSortOrders} type="button">
              <RotateCcw size={14} style={{ marginRight: 4 }} />
              Reset
            </button>
            <form action={saveCategoryOrderAction} style={{ display: "inline" }}>
              {optimisticCategories.map((c) => (
                <React.Fragment key={c.id}>
                  <input type="hidden" name="categoryId" value={c.id} />
                  <input
                    type="hidden"
                    name="sortOrder"
                    value={sortOrders[c.id] ?? c.sortOrder}
                  />
                </React.Fragment>
              ))}
              <button className={styles.btnSaveOrder} type="submit">
                <Save size={14} />
                Save Serial Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Toolbar: Search, Filters & View Toggle */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarTopRow}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Search by name, slug or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                className={styles.searchClear}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.filterControlsRight}>
            <select
              className={styles.selectDropdown}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort categories"
            >
              <option value="sortOrder">Sort: Serial Order (Ascending)</option>
              <option value="sortOrder-desc">Sort: Serial Order (Descending)</option>
              <option value="name-asc">Sort: Name (A to Z)</option>
              <option value="name-desc">Sort: Name (Z to A)</option>
              <option value="products-desc">Sort: Most Products First</option>
              <option value="products-asc">Sort: Least Products First</option>
              <option value="recent">Sort: Recently Created</option>
            </select>

            <div className={styles.viewModeGroup}>
              <button
                className={`${styles.viewModeBtn} ${viewMode === "table" ? styles.viewModeBtnActive : ""}`}
                onClick={() => setViewMode("table")}
                title="Table view"
                type="button"
              >
                <List size={16} />
              </button>
              <button
                className={`${styles.viewModeBtn} ${viewMode === "grid" ? styles.viewModeBtnActive : ""}`}
                onClick={() => setViewMode("grid")}
                title="Card grid view"
                type="button"
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.statusTabsRow}>
          <div className={styles.statusTabs}>
            <button
              className={`${styles.statusTabBtn} ${statusFilter === "ALL" ? styles.statusTabBtnActive : ""}`}
              onClick={() => setStatusFilter("ALL")}
              type="button"
            >
              All Categories
              <span className={styles.tabBadge}>{formatNumber(stats.total)}</span>
            </button>
            <button
              className={`${styles.statusTabBtn} ${statusFilter === "ACTIVE" ? styles.statusTabBtnActive : ""}`}
              onClick={() => setStatusFilter("ACTIVE")}
              type="button"
            >
              Active
              <span className={styles.tabBadge}>{formatNumber(stats.active)}</span>
            </button>
            <button
              className={`${styles.statusTabBtn} ${statusFilter === "INACTIVE" ? styles.statusTabBtnActive : ""}`}
              onClick={() => setStatusFilter("INACTIVE")}
              type="button"
            >
              Hidden
              <span className={styles.tabBadge}>{formatNumber(stats.inactive)}</span>
            </button>
          </div>

          <div className={styles.resultsSummary}>
            Showing {formatNumber(filteredCategories.length)} of {formatNumber(optimisticCategories.length)} categories
            {(searchQuery || statusFilter !== "ALL") && (
              <button
                className={styles.resetBtn}
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                type="button"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Main Content: Table or Grid View */}
      {filteredCategories.length === 0 ? (
        <div className={styles.emptyState}>
          <Layers className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No categories found</h3>
          <p className={styles.emptySubtitle}>
            {searchQuery
              ? `No category matched “${searchQuery}”. Try clearing your search term.`
              : "No categories in this filter view. Add a new category to get started."}
          </p>
          <button className={styles.btnPrimary} onClick={handleOpenCreateModal} style={{ marginTop: 8 }} type="button">
            <Plus size={15} />
            Add Category
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.categoryTable}>
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Serial #</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => {
                  const currentSort = sortOrders[category.id] ?? category.sortOrder;
                  const isDirty = currentSort !== category.sortOrder;

                  return (
                    <tr key={category.id} className={styles.categoryRow}>
                      {/* Serial Number Column */}
                      <td className={styles.cell}>
                        <div className={styles.serialInputWrap}>
                          <input
                            type="number"
                            min="-9999"
                            max="9999"
                            value={currentSort}
                            onChange={(e) =>
                              handleSortOrderChange(category.id, parseInt(e.target.value, 10) || 0)
                            }
                            className={`${styles.serialInput} ${isDirty ? styles.serialInputDirty : ""}`}
                            title={isDirty ? "Unsaved serial order" : "Serial order"}
                          />
                        </div>
                      </td>

                      {/* Category Identity Column */}
                      <td className={styles.cell}>
                        <div className={styles.categoryMetaCell}>
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className={styles.categoryThumb}
                              style={{ borderColor: category.accent ? `${category.accent}40` : undefined }}
                            />
                          ) : (
                            <div
                              className={styles.categoryThumbFallback}
                              style={{
                                color: category.accent || "#38bdf8",
                                background: category.accent ? `${category.accent}18` : undefined,
                              }}
                            >
                              <Layers size={22} />
                            </div>
                          )}

                          <div className={styles.categoryNameCol}>
                            <div className={styles.categoryNameRow}>
                              {category.accent && (
                                <span
                                  className={styles.accentDot}
                                  style={{
                                    backgroundColor: category.accent,
                                    color: category.accent,
                                  }}
                                  title={`Accent: ${category.accent}`}
                                />
                              )}
                              <span className={styles.categoryNameText}>{category.name}</span>
                            </div>
                            <span className={styles.slugPill}>/{category.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* Description Column */}
                      <td className={styles.cell}>
                        <div className={styles.descText} title={category.description || "No description"}>
                          {category.description || <span style={{ opacity: 0.5 }}>—</span>}
                        </div>
                      </td>

                      {/* Products Badge Column */}
                      <td className={styles.cell}>
                        <Link
                          href={`/admin/categories/${category.id}/products`}
                          className={styles.productsBadgeLink}
                          title="Manage products in this category"
                        >
                          <Package size={14} />
                          <span>{formatNumber(category._count?.products || 0)} Products</span>
                        </Link>
                      </td>

                      {/* Status Column */}
                      <td className={styles.cell}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(category)}
                          className={`${styles.statusBtn} ${
                            category.isActive ? styles.statusActive : styles.statusInactive
                          }`}
                          title={`Click to set as ${category.isActive ? "Hidden" : "Active"}`}
                        >
                          {category.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{category.isActive ? "Active" : "Hidden"}</span>
                        </button>
                      </td>

                      {/* Actions Column */}
                      <td className={styles.cell} style={{ textAlign: "right" }}>
                        <div className={styles.actionsGroup} style={{ justifyContent: "flex-end" }}>
                          <Link
                            href={`/admin/categories/${category.id}/products`}
                            className={styles.btnActionProducts}
                            title="Add / Manage Products"
                          >
                            <Plus size={13} />
                            <span>Add Products</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(category)}
                            className={styles.btnActionEdit}
                            title="Edit Category Details"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(category)}
                            className={styles.btnActionDelete}
                            title="Delete / Deactivate Category"
                          >
                            <Trash2 size={13} />
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
          {filteredCategories.map((category) => {
            const currentSort = sortOrders[category.id] ?? category.sortOrder;
            const isDirty = currentSort !== category.sortOrder;
            const accent = category.accent || "#0ea5e9";

            return (
              <div key={category.id} className={styles.categoryCard}>
                <div
                  className={styles.cardTopAccentBar}
                  style={{
                    background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
                  }}
                />

                <div className={styles.cardBody}>
                  <div className={styles.cardHeaderRow}>
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className={styles.cardThumb}
                        style={{ borderColor: `${accent}40` }}
                      />
                    ) : (
                      <div
                        className={styles.cardThumb}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: accent,
                          background: `${accent}15`,
                        }}
                      >
                        <Layers size={26} />
                      </div>
                    )}

                    <div className={styles.cardHeaderInfo}>
                      <div className={styles.cardMetaRow}>
                        <span className={styles.cardTitle}>{category.name}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(category)}
                          className={`${styles.statusBtn} ${
                            category.isActive ? styles.statusActive : styles.statusInactive
                          }`}
                        >
                          {category.isActive ? "Active" : "Hidden"}
                        </button>
                      </div>

                      <span className={styles.slugPill}>/{category.slug}</span>
                    </div>
                  </div>

                  <p className={styles.cardDesc} title={category.description || ""}>
                    {category.description || <span style={{ opacity: 0.5 }}>No description provided.</span>}
                  </p>

                  <div className={styles.cardMetricsRow}>
                    <div className={styles.cardSerialWrap}>
                      <span>Serial:</span>
                      <input
                        type="number"
                        min="-9999"
                        max="9999"
                        value={currentSort}
                        onChange={(e) =>
                          handleSortOrderChange(category.id, parseInt(e.target.value, 10) || 0)
                        }
                        className={`${styles.serialInput} ${isDirty ? styles.serialInputDirty : ""}`}
                      />
                    </div>

                    <Link
                      href={`/admin/categories/${category.id}/products`}
                      className={styles.productsBadgeLink}
                    >
                      <Package size={13} />
                      <span>{formatNumber(category._count?.products || 0)} Products</span>
                    </Link>
                  </div>
                </div>

                <div className={styles.cardFooterActions}>
                  <Link
                    href={`/admin/categories/${category.id}/products`}
                    className={styles.btnActionProducts}
                  >
                    <Plus size={13} />
                    <span>Manage Products</span>
                  </Link>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(category)}
                      className={styles.btnActionEdit}
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(category)}
                      className={styles.btnActionDelete}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. CREATE / EDIT CATEGORY MODAL */}
      {modalMode && (
        <div className={styles.modalBackdrop} onClick={() => setModalMode(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div
                  className={styles.modalIcon}
                  style={{
                    backgroundColor: `${formAccent}20`,
                    color: formAccent,
                    border: `1px solid ${formAccent}40`,
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <h2 className={styles.modalTitle}>
                  {modalMode === "create" ? "Add New Category" : `Edit “${categoryToEdit?.name}”`}
                </h2>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setModalMode(null)}
                type="button"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form action={saveCategoryAction} className={styles.modalForm}>
              {categoryToEdit?.id && (
                <input type="hidden" name="categoryId" value={categoryToEdit.id} />
              )}

              <div className={styles.formGrid}>
                {/* Category Name */}
                <div className={styles.formFieldFull}>
                  <label className={styles.formLabel}>
                    Category Name *
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      className={styles.autoSlugBtn}
                      title="Generate slug from name"
                    >
                      Auto-fill slug
                    </button>
                  </label>
                  <input
                    name="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Operating Systems"
                    className={styles.formInput}
                    required
                  />
                </div>

                {/* Slug */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>URL Slug *</label>
                  <input
                    name="slug"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="operating-systems"
                    className={styles.formInput}
                    required
                  />
                </div>

                {/* Sort Order */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Serial Order</label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
                    className={styles.formInput}
                  />
                </div>

                {/* Accent Color Picker & Presets */}
                <div className={styles.formFieldFull}>
                  <label className={styles.formLabel}>
                    Theme Accent Color
                    <span style={{ fontFamily: "var(--font-mono, monospace)", color: formAccent }}>
                      {formAccent}
                    </span>
                  </label>
                  <div className={styles.colorPickerRow}>
                    <input
                      type="color"
                      name="accent"
                      value={formAccent}
                      onChange={(e) => setFormAccent(e.target.value)}
                      className={styles.colorNativeInput}
                      title="Pick custom color"
                    />
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setFormAccent(preset.color)}
                        className={`${styles.colorPresetBtn} ${
                          formAccent.toLowerCase() === preset.color.toLowerCase()
                            ? styles.colorPresetBtnSelected
                            : ""
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className={styles.formFieldFull}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    name="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Short description highlighting this category..."
                    className={styles.formTextarea}
                  />
                </div>

                {/* Image Selection */}
                <div className={styles.formFieldFull}>
                  <label className={styles.formLabel}>Image Source</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      name="imageUrl"
                      type="text"
                      list="category-img-content-datalist"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Image URL or choose from /img_content/..."
                      className={styles.formInput}
                      autoComplete="on"
                    />
                    <datalist id="category-img-content-datalist">
                      {AVAILABLE_IMG_CONTENT.map((path) => (
                        <option key={path} value={path} />
                      ))}
                    </datalist>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Or upload file:</span>
                      <input name="image" type="file" accept="image/*" style={{ fontSize: 12 }} />
                    </div>

                    {formImageUrl && (
                      <div className={styles.imagePreviewBox}>
                        <img
                          src={formImageUrl}
                          alt="Category preview"
                          className={styles.imagePreviewThumb}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>Live URL Preview</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className={styles.formFieldFull}>
                  <label className={styles.checkboxLabel}>
                    <input
                      name="isActive"
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <span>Active (Visible on Storefront)</span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setModalMode(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {modalMode === "create" ? "Create Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. SAFE DELETE CONFIRMATION MODAL */}
      {categoryToDelete && (
        <div className={styles.modalBackdrop} onClick={() => setCategoryToDelete(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div
                  className={styles.modalIcon}
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <h2 className={styles.modalTitle}>Delete “{categoryToDelete.name}”?</h2>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setCategoryToDelete(null)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#cbd5e1" }}>
              {categoryToDelete._count?.products > 0 ? (
                <>
                  <p style={{ margin: 0 }}>
                    This category currently contains{" "}
                    <strong style={{ color: "#ffffff" }}>
                      {formatNumber(categoryToDelete._count.products)} products
                    </strong>
                    .
                  </p>
                  <p style={{ margin: 0, color: "#fbbf24" }}>
                    ⚠️ To protect existing customer orders and product catalog integrity, deleting this category will{" "}
                    <strong>deactivate and hide it</strong> from the storefront rather than wiping it permanently.
                  </p>
                </>
              ) : (
                <p style={{ margin: 0 }}>
                  This category has no products assigned and will be <strong>permanently deleted</strong>. This action
                  cannot be undone.
                </p>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setCategoryToDelete(null)}
              >
                Cancel
              </button>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="categoryId" value={categoryToDelete.id} />
                <button type="submit" className={styles.btnConfirmDelete}>
                  {categoryToDelete._count?.products > 0 ? "Deactivate & Hide" : "Confirm Delete"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

