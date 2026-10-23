"use client";

import { useState } from "react";
import { AVAILABLE_IMG_CONTENT } from "@/lib/available-images";
import { saveSoftwareDownloadAction } from "@/app/admin/actions";
import { SoftwareIconTile } from "@/components/downloads/SoftwareIconTile";
import type { SoftwareDownloadItem, SoftwareDownloadVariant, SoftwareVersionOption } from "@/data/software-downloads";
import styles from "@/app/admin/admin.module.css";
import { Plus, Trash2, ExternalLink } from "lucide-react";

const PRESET_VARIANTS: { value: SoftwareDownloadVariant; label: string }[] = [
  { value: "office-2024", label: "Office 2024 Pro Plus" },
  { value: "office-365", label: "Microsoft 365 Apps" },
  { value: "win-11", label: "Windows 11 Pro" },
  { value: "win-10", label: "Windows 10 Pro" },
  { value: "office-2021", label: "Office 2021 Pro Plus" },
  { value: "office-multi", label: "Office 2019 (Pro Plus & Home & Business)" },
  { value: "office-2016", label: "Office 2016 Pro Plus" },
  { value: "office-2010", label: "Office 2010 Pro Plus" },
  { value: "visio", label: "Visio Pro (24/21/19/16)" },
  { value: "project", label: "Project Pro (24/21/19/16)" },
  { value: "custom", label: "Custom / Generic Software" },
];

export function SoftwareDownloadForm({
  download = {},
  submitLabel = "Save Software Download",
}: {
  download?: Partial<SoftwareDownloadItem>;
  submitLabel?: string;
}) {
  const [selectedVariant, setSelectedVariant] = useState<SoftwareDownloadVariant>(
    download.variant || "custom"
  );
  const [imageUrl, setImageUrl] = useState<string>(download.image || "");
  const [versions, setVersions] = useState<SoftwareVersionOption[]>(
    download.versions && download.versions.length > 0
      ? download.versions
      : []
  );

  const addVersionRow = () => {
    setVersions((prev) => [
      ...prev,
      { label: "", url: "", arch: "64-bit / 32-bit" },
    ]);
  };

  const removeVersionRow = (index: number) => {
    setVersions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVersionRow = (
    index: number,
    field: keyof SoftwareVersionOption,
    value: string
  ) => {
    setVersions((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  return (
    <form action={saveSoftwareDownloadAction} className={styles.panel}>
      {download.id && (
        <input type="hidden" name="downloadId" value={download.id} />
      )}

      {/* Live Preview Box */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "16px 20px",
          background: "var(--surface-sunken, rgba(0, 0, 0, 0.04))",
          borderRadius: 12,
          marginBottom: 20,
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ width: 88, height: 88, flexShrink: 0 }}>
          <SoftwareIconTile
            variant={selectedVariant}
            image={imageUrl || undefined}
            title={download.title || "Preview"}
          />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {download.title || "Software Title Preview"}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            Visual preview of how this software tile icon will appear on the public download center.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Title / Name */}
        <div className={styles.field}>
          <label>Title / Name *</label>
          <input
            name="title"
            defaultValue={download.title ?? ""}
            placeholder="e.g. Office 2024 Pro Plus"
            required
          />
        </div>

        {/* Full Name */}
        <div className={styles.field}>
          <label>Full Edition Subtitle</label>
          <input
            name="fullName"
            defaultValue={download.fullName ?? ""}
            placeholder="e.g. Microsoft Office 2024 Professional Plus Official Setup"
          />
        </div>

        {/* Category */}
        <div className={styles.field}>
          <label>Category</label>
          <input
            name="category"
            defaultValue={download.category ?? "Office Suite"}
            placeholder="e.g. Office Suite, Windows OS, Developer Tools"
          />
        </div>

        {/* Badge Label */}
        <div className={styles.field}>
          <label>Badge Label (Optional)</label>
          <input
            name="badgeLabel"
            defaultValue={download.badgeLabel ?? ""}
            placeholder="e.g. Official ISO, Retail IMG, Cloud Setup"
          />
        </div>

        {/* 3D Icon Preset */}
        <div className={styles.field}>
          <label>3D Icon Vector Preset</label>
          <select
            name="variant"
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value as SoftwareDownloadVariant)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          >
            {PRESET_VARIANTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className={styles.field}>
          <label>Serial / Sort Order</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={download.sortOrder ?? 10}
            min="-9999"
            max="9999"
          />
        </div>

        {/* Version String */}
        <div className={styles.field}>
          <label>Release Version</label>
          <input
            name="version"
            defaultValue={download.version ?? "Latest Official"}
            placeholder="e.g. v2408 (Build 17928.20156)"
          />
        </div>

        {/* Architecture */}
        <div className={styles.field}>
          <label>Architecture</label>
          <input
            name="architecture"
            defaultValue={download.architecture ?? "32-bit / 64-bit"}
            placeholder="e.g. 64-bit & 32-bit (x86/x64)"
          />
        </div>

        {/* File Size */}
        <div className={styles.field}>
          <label>File Size</label>
          <input
            name="fileSize"
            defaultValue={download.fileSize ?? "4.8 GB"}
            placeholder="e.g. 4.8 GB or 5.2 GB ISO"
          />
        </div>

        {/* File Format */}
        <div className={styles.field}>
          <label>File Format</label>
          <input
            name="fileType"
            defaultValue={download.fileType ?? "ISO / IMG"}
            placeholder="e.g. ISO / IMG, EXE, MSI"
          />
        </div>

        {/* Primary Download Link */}
        <div className={styles.fieldFull}>
          <label>Primary Download Link (Official CDN / Direct Link) *</label>
          <input
            name="downloadUrl"
            type="url"
            defaultValue={download.downloadUrl ?? ""}
            placeholder="https://officecdn.microsoft.com/... or Google Drive link"
            required
          />
        </div>

        {/* Buy Product Page Link */}
        <div className={styles.fieldFull}>
          <label>Product Buy Link (Direct link to buy license key on this site)</label>
          <input
            name="productLink"
            defaultValue={download.productLink ?? "/products"}
            placeholder="e.g. /products/office-2024-pro-plus"
          />
        </div>

        {/* Image Upload */}
        <div className={styles.field}>
          <label>Upload Custom Picture (Optional)</label>
          <input name="image" type="file" accept="image/*" />
        </div>

        {/* Or Image URL */}
        <div className={styles.field}>
          <label>Or Image URL (Cloudinary / Local /img_content)</label>
          <input
            name="imageUrl"
            type="text"
            list="download-img-content-datalist"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/img_content/win11pro.png or https://..."
            autoComplete="on"
          />
          <datalist id="download-img-content-datalist">
            {AVAILABLE_IMG_CONTENT.map((path) => (
              <option key={path} value={path} />
            ))}
          </datalist>
        </div>

        {/* Clear Image checkbox if image exists */}
        {download.image && (
          <div className={styles.fieldFull}>
            <label className={styles.check}>
              <input name="clearImage" type="checkbox" /> Clear custom image and use 3D Vector Icon Preset instead
            </label>
          </div>
        )}

        {/* Active Toggle */}
        <div className={styles.fieldFull}>
          <label className={styles.check}>
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={download.isActive ?? true}
            />{" "}
            Active (Display on public Software Download Center)
          </label>
        </div>
      </div>

      {/* Multiple Version / Editions Section */}
      <div
        style={{
          marginTop: 24,
          padding: 20,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              Multiple Editions / Specific Version Links (Optional)
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              Add specific sub-edition links (e.g. 64-bit Direct, 32-bit Direct, Home & Business, Offline Installer).
            </p>
          </div>
          <button
            type="button"
            onClick={addVersionRow}
            className={styles.buttonSecondary}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={16} /> Add Link Option
          </button>
        </div>

        {versions.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, fontStyle: "italic" }}>
            No extra edition links added yet. The primary download link above will be used directly.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {versions.map((ver, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 2fr 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  background: "var(--surface-sunken, rgba(0,0,0,0.02))",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <input
                    name="versionLabel"
                    placeholder="Edition Label (e.g. 64-bit Direct)"
                    value={ver.label}
                    onChange={(e) => updateVersionRow(idx, "label", e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <input
                    name="versionUrl"
                    type="url"
                    placeholder="Download URL (https://...)"
                    value={ver.url}
                    onChange={(e) => updateVersionRow(idx, "url", e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <input
                    name="versionArch"
                    placeholder="Arch (e.g. 64-bit)"
                    value={ver.arch ?? ""}
                    onChange={(e) => updateVersionRow(idx, "arch", e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => removeVersionRow(idx)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--danger, #ef4444)",
                      cursor: "pointer",
                      padding: 6,
                    }}
                    title="Remove link option"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions} style={{ marginTop: 24 }}>
        <button className={styles.button} type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
