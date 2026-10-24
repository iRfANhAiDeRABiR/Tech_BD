"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  Copy,
  Check,
  Maximize2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { updateProductImageAction } from "@/app/admin/actions";
import styles from "./AdminImagesManager.module.css";

export interface ImageItem {
  fileName: string;
  url: string;
  sizeBytes: number;
  productsUsing: Array<{ id: string; name: string }>;
  categoriesUsing: Array<{ id: number; name: string }>;
}

export interface AdminProductOption {
  id: string;
  name: string;
  image: string | null;
}

interface AdminImagesManagerProps {
  images: ImageItem[];
  products: AdminProductOption[];
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function AdminImagesManager({ images, products }: AdminImagesManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "USED" | "UNUSED">("ALL");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "most-used" | "size-desc">("name-asc");

  // Modals & previews
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  const [assigningImage, setAssigningImage] = useState<ImageItem | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Copy helper
  const handleCopyPath = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => {
      setCopiedUrl(null);
    }, 2000);
  };

  // Stats computation
  const stats = useMemo(() => {
    const total = images.length;
    const used = images.filter((img) => img.productsUsing.length > 0 || img.categoriesUsing.length > 0).length;
    const unused = total - used;
    const productAssignments = images.reduce((acc, img) => acc + img.productsUsing.length, 0);
    return { total, used, unused, productAssignments };
  }, [images]);

  // Filtered & Sorted Images
  const filteredImages = useMemo(() => {
    let list = [...images];

    // Status filter
    if (statusFilter === "USED") {
      list = list.filter((img) => img.productsUsing.length > 0 || img.categoriesUsing.length > 0);
    } else if (statusFilter === "UNUSED") {
      list = list.filter((img) => img.productsUsing.length === 0 && img.categoriesUsing.length === 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (img) =>
          img.fileName.toLowerCase().includes(q) ||
          img.productsUsing.some((p) => p.name.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "name-asc") return a.fileName.localeCompare(b.fileName);
      if (sortBy === "name-desc") return b.fileName.localeCompare(a.fileName);
      if (sortBy === "most-used") return b.productsUsing.length - a.productsUsing.length;
      if (sortBy === "size-desc") return b.sizeBytes - a.sizeBytes;
      return 0;
    });

    return list;
  }, [images, statusFilter, searchQuery, sortBy]);

  return (
    <div className={styles.container}>
      {/* 1. Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>
            Media & Image Library
            <span className={styles.titleBadge}>{images.length} Images</span>
          </h1>
          <p className={styles.subtitle}>
            Browse, inspect showcase banners in <code>/img_content</code>, track product assignments, and update product images.
          </p>
        </div>
      </div>

      {/* 2. Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Images</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <ImageIcon size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Assigned to Products</span>
            <span className={styles.statValue}>{stats.productAssignments}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <Package size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active in Catalog</span>
            <span className={styles.statValue}>{stats.used}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconSky}`}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Available / Unused</span>
            <span className={styles.statValue}>{stats.unused}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconAmber}`}>
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* 3. Toolbar / Controls */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarTopRow}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Search images or products using them..."
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

          <select
            className={styles.selectDropdown}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort images"
          >
            <option value="name-asc">Sort: Name (A to Z)</option>
            <option value="name-desc">Sort: Name (Z to A)</option>
            <option value="most-used">Sort: Most Products Using</option>
            <option value="size-desc">Sort: File Size (Largest)</option>
          </select>
        </div>

        <div className={styles.statusTabsRow}>
          <div className={styles.statusTabs}>
            <button
              className={`${styles.statusTabBtn} ${statusFilter === "ALL" ? styles.statusTabBtnActive : ""}`}
              onClick={() => setStatusFilter("ALL")}
              type="button"
            >
              All Images
              <span className={styles.tabBadge}>{stats.total}</span>
            </button>
            <button
              className={`${styles.statusTabBtn} ${statusFilter === "USED" ? styles.statusTabBtnActive : ""}`}
              onClick={() => setStatusFilter("USED")}
              type="button"
            >
              Assigned in Store
              <span className={styles.tabBadge}>{stats.used}</span>
            </button>
            <button
              className={`${styles.statusTabBtn} ${statusFilter === "UNUSED" ? styles.statusTabBtnActive : ""}`}
              onClick={() => setStatusFilter("UNUSED")}
              type="button"
            >
              Unassigned / Free
              <span className={styles.tabBadge}>{stats.unused}</span>
            </button>
          </div>

          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            Showing {filteredImages.length} of {images.length} images
          </span>
        </div>
      </div>

      {/* 4. Image Cards Grid */}
      <div className={styles.imagesGrid}>
        {filteredImages.map((img) => {
          const isCopied = copiedUrl === img.url;
          const isUsed = img.productsUsing.length > 0 || img.categoriesUsing.length > 0;

          return (
            <div key={img.url} className={styles.imageCard}>
              <div
                className={styles.imageThumbWrap}
                onClick={() => setPreviewImage(img)}
                title="Click to view full image preview"
              >
                <img src={img.url} alt={img.fileName} className={styles.imageThumb} loading="lazy" />
                <div className={styles.zoomOverlay}>
                  <Maximize2 size={14} />
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardFileNameRow}>
                  <span className={styles.cardFileName} title={img.fileName}>
                    {img.fileName}
                  </span>
                  <button
                    type="button"
                    className={`${styles.copyBtn} ${isCopied ? styles.copyBtnActive : ""}`}
                    onClick={() => handleCopyPath(img.url)}
                    title={isCopied ? "Copied!" : "Copy image path"}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <span className={styles.fileSizePill}>{formatBytes(img.sizeBytes)}</span>

                <div className={styles.usageSection}>
                  {isUsed ? (
                    <>
                      <span className={styles.usedBadge}>
                        <Package size={12} />
                        Used in {img.productsUsing.length} product{img.productsUsing.length !== 1 ? "s" : ""}
                      </span>

                      {img.productsUsing.length > 0 && (
                        <div className={styles.productList}>
                          {img.productsUsing.slice(0, 3).map((p) => (
                            <Link
                              key={p.id}
                              href={`/admin/products/${p.id}/edit`}
                              className={styles.productLink}
                              title={`Edit ${p.name}`}
                            >
                              <span>• {p.name}</span>
                              <ExternalLink size={10} style={{ opacity: 0.6 }} />
                            </Link>
                          ))}
                          {img.productsUsing.length > 3 && (
                            <span style={{ fontSize: 11, color: "#94a3b8", paddingLeft: 4 }}>
                              +{img.productsUsing.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className={styles.unusedBadge}>
                      <Sparkles size={12} />
                      Available (Unassigned)
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.btnAssign}
                  onClick={() => {
                    setAssigningImage(img);
                    setSelectedProductId(products[0]?.id || "");
                  }}
                >
                  <ArrowRight size={13} />
                  <span>Assign to Product</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewImage(null)}>
          <div className={styles.previewModalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewModalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ImageIcon size={18} color="#c084fc" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>
                  {previewImage.fileName}
                </span>
              </div>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => setPreviewImage(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.previewModalBody}>
              <img
                src={previewImage.url}
                alt={previewImage.fileName}
                className={styles.previewFullImage}
              />
            </div>
            <div
              style={{
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Path: <code>{previewImage.url}</code>
              </span>
              <button
                type="button"
                className={styles.btnAssign}
                style={{ width: "auto" }}
                onClick={() => handleCopyPath(previewImage.url)}
              >
                <Copy size={13} />
                <span>Copy Path</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ASSIGN TO PRODUCT MODAL */}
      {assigningImage && (
        <div className={styles.modalBackdrop} onClick={() => setAssigningImage(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Package size={20} color="#34d399" />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  Assign Image to Product
                </h2>
              </div>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => setAssigningImage(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
              <img
                src={assigningImage.url}
                alt={assigningImage.fileName}
                style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8, background: "#0b0d14" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                  {assigningImage.fileName}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  {formatBytes(assigningImage.sizeBytes)}
                </span>
              </div>
            </div>

            <form action={updateProductImageAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="hidden" name="imageUrl" value={assigningImage.url} />

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>
                  Select Target Product *
                </label>
                <select
                  name="productId"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={styles.selectDropdown}
                  style={{ width: "100%", padding: 10 }}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setAssigningImage(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Save & Update Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
