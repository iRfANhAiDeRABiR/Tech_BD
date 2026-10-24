"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { saveCategoryAction } from "@/app/admin/actions";
import { AVAILABLE_IMG_CONTENT } from "@/lib/available-images";
import styles from "./AdminCategoriesManager.module.css";

type CategoryValue = {
  id?: number;
  name?: string;
  slug?: string;
  description?: string | null;
  accent?: string | null;
  image?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

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

export function CategoryForm({
  category = {},
  submitLabel,
}: {
  category?: CategoryValue;
  submitLabel: string;
}) {
  const [name, setName] = useState(category.name ?? "");
  const [slug, setSlug] = useState(category.slug ?? "");
  const [accent, setAccent] = useState(category.accent ?? "#0ea5e9");
  const [sortOrder, setSortOrder] = useState(category.sortOrder ?? 0);
  const [description, setDescription] = useState(category.description ?? "");
  const [imageUrl, setImageUrl] = useState(category.image ?? "");
  const [isActive, setIsActive] = useState(category.isActive ?? true);

  const handleAutoSlug = () => {
    if (name.trim()) {
      setSlug(slugify(name));
    }
  };

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.025)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 16,
        padding: 24,
        maxWidth: 720,
      }}
    >
      <form action={saveCategoryAction} className={styles.modalForm}>
        {category.id && <input type="hidden" name="categoryId" value={category.id} />}

        <div className={styles.formGrid}>
          {/* Name */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>
              Category Name *
              <button
                type="button"
                onClick={handleAutoSlug}
                className={styles.autoSlugBtn}
              >
                Auto-fill slug
              </button>
            </label>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Graphic & Design Software"
              className={styles.formInput}
              required
            />
          </div>

          {/* Slug */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>URL Slug *</label>
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="graphic-design-software"
              className={styles.formInput}
              required
            />
          </div>

          {/* Sort Order */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Serial Order (Sort)</label>
            <input
              type="number"
              name="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              className={styles.formInput}
            />
          </div>

          {/* Accent Color */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>
              Accent Color
              <span style={{ fontFamily: "var(--font-mono, monospace)", color: accent }}>
                {accent}
              </span>
            </label>
            <div className={styles.colorPickerRow}>
              <input
                type="color"
                name="accent"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className={styles.colorNativeInput}
              />
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => setAccent(preset.color)}
                  className={`${styles.colorPresetBtn} ${
                    accent.toLowerCase() === preset.color.toLowerCase()
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the category..."
              className={styles.formTextarea}
            />
          </div>

          {/* Image */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>Image Source</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                name="imageUrl"
                type="text"
                list="category-edit-datalist"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/img_content/adobe.png"
                className={styles.formInput}
              />
              <datalist id="category-edit-datalist">
                {AVAILABLE_IMG_CONTENT.map((path) => (
                  <option key={path} value={path} />
                ))}
              </datalist>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Or upload new file:</span>
                <input name="image" type="file" accept="image/*" style={{ fontSize: 12 }} />
              </div>

              {imageUrl && (
                <div className={styles.imagePreviewBox}>
                  <img
                    src={imageUrl}
                    alt="Preview"
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
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span>Active (Visible on Storefront)</span>
            </label>
          </div>
        </div>

        <div className={styles.modalFooter} style={{ justifyContent: "space-between" }}>
          <Link href="/admin/categories" className={styles.btnCancel} style={{ textDecoration: "none" }}>
            Cancel
          </Link>
          <button type="submit" className={styles.btnPrimary}>
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
