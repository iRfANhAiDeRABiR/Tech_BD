"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";
import {
  convertImagesToPdf,
  downloadBlob,
  formatBytes,
} from "@/lib/imageProcessing";
import styles from "./ImageToPdf.module.css";

interface ImageItem {
  file: File;
  url: string;
  id: string;
  width: number;
  height: number;
}

/* ── Inline SVG Icons ─────────────────────────────────────── */
function UploadCloudIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

function GripVerticalIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function FileCheckIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

function DownloadIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function AlertCircleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function ShieldCheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function RefreshCwIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

/* ── Helper: get image dimensions ─────────────────────────── */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/* ── Main Component ───────────────────────────────────────── */
export function ImageToPdfClient() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("auto");
  const [margin, setMargin] = useState<"none" | "small" | "medium" | "large">("none");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Cleanup on unmount ─────────────────────────────────── */
  useEffect(() => {
    return () => {
      // Cleanup is handled per-image removal; this is a safety net
    };
  }, []);

  /* ── Add files helper ───────────────────────────────────── */
  const addFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const newImages: ImageItem[] = await Promise.all(
      imageFiles.map(async (file) => {
        const dims = await getImageDimensions(file);
        return {
          file,
          url: URL.createObjectURL(file),
          id: Math.random().toString(36).slice(2, 9),
          width: dims.width,
          height: dims.height,
        };
      })
    );

    setImages((prev) => [...prev, ...newImages]);
    setResult(null);
    setError(null);
  }, []);

  /* ── File input change ──────────────────────────────────── */
  const handleFilesSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      addFiles(files);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles]
  );

  /* ── Drag & Drop on upload zone ─────────────────────────── */
  const handleDropZoneDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDropZoneDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDropZoneDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files || []);
      addFiles(files);
    },
    [addFiles]
  );

  /* ── Remove image ───────────────────────────────────────── */
  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
    setResult(null);
  }, []);

  /* ── Clear all ──────────────────────────────────────────── */
  const handleClearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setError(null);
  }, [images, result]);

  /* ── Drag reorder ───────────────────────────────────────── */
  const handleRowDragStart = useCallback((idx: number) => {
    setDragIndex(idx);
  }, []);

  const handleRowDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== idx) {
        setDragOverIndex(idx);
      }
    },
    [dragIndex]
  );

  const handleRowDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleRowDrop = useCallback(
    (idx: number) => {
      if (dragIndex === null || dragIndex === idx) {
        setDragIndex(null);
        setDragOverIndex(null);
        return;
      }
      setImages((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(dragIndex, 1);
        updated.splice(idx, 0, moved);
        return updated;
      });
      setDragIndex(null);
      setDragOverIndex(null);
      setResult(null);
    },
    [dragIndex]
  );

  const handleRowDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  /* ── Convert ────────────────────────────────────────────── */
  const handleConvert = useCallback(async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      const urls = images.map((img) => img.url);
      const effectiveOrientation =
        orientation === "auto" ? "portrait" : orientation;
      const blob = await convertImagesToPdf(urls, {
        pageSize,
        orientation: effectiveOrientation,
        margin,
      });
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
      });
      notify.success("PDF created", {
        description: `${images.length} image${images.length > 1 ? "s were" : " was"} converted into a PDF (${formatBytes(blob.size)}).`,
        id: "pdf-create-toast",
      });
    } catch (err) {
      const sanitized = getUserFriendlyError(err, "Failed to create PDF.");
      setError(sanitized);
      notify.error("PDF creation failed", {
        description: sanitized,
        id: "pdf-error-toast",
      });
    } finally {
      setProcessing(false);
    }
  }, [images, pageSize, orientation, margin, result]);

  /* ── Download ───────────────────────────────────────────── */
  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadBlob(result.blob, "images-converted.pdf");
    notify.info("Download started", {
      description: "Your PDF is being downloaded.",
      id: "pdf-download-toast",
    });
  }, [result]);

  /* ── Reset / Start Over ─────────────────────────────────── */
  const handleReset = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  }, [result]);

  const handleStartOver = useCallback(() => {
    handleClearAll();
  }, [handleClearAll]);

  const totalSize = images.reduce((sum, img) => sum + img.file.size, 0);

  /* ── Keyboard handler for dropzone ──────────────────────── */
  const handleDropzoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    []
  );

  /* ═══════════════════════════════════════════════════════════
     RENDER: Success State
     ═══════════════════════════════════════════════════════════ */
  if (result && images.length > 0) {
    return (
      <div className={styles.container}>
        {/* Capability Chips */}
        <div className={styles.chips}>
          <span className={styles.chip}>JPG</span>
          <span className={styles.chip}>PNG</span>
          <span className={styles.chip}>WebP</span>
          <span className={styles.chip}>Multiple images</span>
        </div>

        <div style={{ marginTop: 24 }}>
          <div className={styles.successCard}>
            <div className={styles.successIconWrap}>
              <FileCheckIcon size={28} />
            </div>
            <h3 className={styles.successTitle}>Your PDF is ready</h3>
            <p className={styles.successFilename}>images-converted.pdf</p>
            <p className={styles.successMeta}>
              {images.length} page{images.length > 1 ? "s" : ""} &bull;{" "}
              {formatBytes(result.blob.size)}
            </p>
            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownload}
              >
                <DownloadIcon size={18} />
                Download PDF
              </button>
              <button
                type="button"
                className={styles.startOverBtn}
                onClick={handleStartOver}
              >
                <RefreshCwIcon size={16} />
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER: Empty State (Upload Dropzone)
     ═══════════════════════════════════════════════════════════ */
  if (images.length === 0) {
    return (
      <div className={styles.container}>
        {/* Capability Chips */}
        <div className={styles.chips}>
          <span className={styles.chip}>JPG</span>
          <span className={styles.chip}>PNG</span>
          <span className={styles.chip}>WebP</span>
          <span className={styles.chip}>Multiple images</span>
        </div>

        <div style={{ marginTop: 24 }}>
          <div
            className={`${styles.dropzoneCard} ${dragOver ? styles.dragOver : ""}`}
            onDragOver={handleDropZoneDragOver}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={handleDropZoneDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={handleDropzoneKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Upload images. Click or drag and drop."
          >
            <div className={styles.uploadIconWrap}>
              <UploadCloudIcon size={28} />
            </div>

            <p className={styles.dropTitle}>
              {dragOver ? "Drop images to add them" : "Drop your images here"}
            </p>
            <p className={styles.dropSubtitle}>
              or click to browse from your device
            </p>

            <button
              type="button"
              className={styles.selectBtn}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <PlusIcon size={16} />
              Select Images
            </button>

            <p className={styles.dropMeta}>
              JPG, PNG, WebP &bull; Multiple files supported
            </p>

            <p className={styles.privacyHint}>
              <ShieldCheckIcon size={14} />
              Processed locally in your browser
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFilesSelected}
            style={{ display: "none" }}
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER: Editor State (Images + Settings)
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className={styles.container}>
      {/* Capability Chips */}
      <div className={styles.chips}>
        <span className={styles.chip}>JPG</span>
        <span className={styles.chip}>PNG</span>
        <span className={styles.chip}>WebP</span>
        <span className={styles.chip}>Multiple images</span>
      </div>

      <div className={styles.editorGrid} style={{ marginTop: 24 }}>
        {/* ── Left: Images Panel ──────────────────────────── */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Images</h3>
            <span className={styles.panelCount}>
              {images.length} selected &bull; {formatBytes(totalSize)}
            </span>
          </div>

          <div className={styles.imageList}>
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={`${styles.imageRow} ${
                  dragIndex === idx ? styles.dragging : ""
                } ${dragOverIndex === idx ? styles.dragOverRow : ""}`}
                draggable
                onDragStart={() => handleRowDragStart(idx)}
                onDragOver={(e) => handleRowDragOver(e, idx)}
                onDragLeave={handleRowDragLeave}
                onDrop={() => handleRowDrop(idx)}
                onDragEnd={handleRowDragEnd}
              >
                {/* Drag Handle */}
                <div
                  className={styles.dragHandle}
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  <GripVerticalIcon size={16} />
                </div>

                {/* Thumbnail */}
                <div className={styles.thumbWrap}>
                  <img
                    src={img.url}
                    alt={img.file.name}
                    className={styles.thumbImg}
                  />
                </div>

                {/* Info */}
                <div className={styles.imageInfo}>
                  <span className={styles.imageName} title={img.file.name}>
                    {img.file.name}
                  </span>
                  <span className={styles.imageMeta}>
                    {img.width > 0 && img.height > 0
                      ? `${img.width} × ${img.height}`
                      : "—"}{" "}
                    &bull; {formatBytes(img.file.size)}
                  </span>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleRemoveImage(img.id)}
                  aria-label={`Remove ${img.file.name}`}
                  title="Remove image"
                >
                  <XIcon size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Add More */}
          <button
            type="button"
            className={styles.addMoreBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            <PlusIcon size={16} />
            Add more images
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFilesSelected}
            style={{ display: "none" }}
            aria-hidden="true"
          />

          {images.length > 1 && (
            <p className={styles.reorderHint}>
              Drag images to reorder PDF pages
            </p>
          )}

          {images.length > 0 && (
            <button
              type="button"
              className={styles.addMoreBtn}
              onClick={handleClearAll}
              style={{
                marginTop: 6,
                borderColor: "rgba(239,68,68,0.2)",
                color: "#ef4444",
              }}
            >
              Clear All Images
            </button>
          )}
        </div>

        {/* ── Right: Settings Panel ───────────────────────── */}
        <div className={`${styles.panel} ${styles.settingsPanel}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>PDF Settings</h3>
          </div>

          {/* Page Size */}
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Page Size</label>
            <div className={styles.segmented}>
              {(
                [
                  ["fit", "Fit to Image"],
                  ["a4", "A4"],
                  ["letter", "Letter"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.segBtn} ${
                    pageSize === val ? styles.segBtnActive : ""
                  }`}
                  onClick={() => setPageSize(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Orientation</label>
            <div className={styles.segmented}>
              {(
                [
                  ["auto", "Auto"],
                  ["portrait", "Portrait"],
                  ["landscape", "Landscape"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.segBtn} ${
                    orientation === val ? styles.segBtnActive : ""
                  }`}
                  onClick={() => setOrientation(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Margins</label>
            <div className={styles.segmented}>
              {(
                [
                  ["none", "None"],
                  ["small", "Small"],
                  ["medium", "Medium"],
                  ["large", "Large"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.segBtn} ${
                    margin === val ? styles.segBtnActive : ""
                  }`}
                  onClick={() => setMargin(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorBox}>
              <div className={styles.errorIcon}>
                <AlertCircleIcon size={18} />
              </div>
              <div className={styles.errorContent}>
                <p className={styles.errorText}>{error}</p>
                <button
                  type="button"
                  className={styles.retryBtn}
                  onClick={handleConvert}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Convert Button */}
          <button
            type="button"
            className={styles.convertBtn}
            onClick={handleConvert}
            disabled={processing || images.length === 0}
          >
            {processing ? (
              <>
                <div className={styles.spinner} />
                Creating PDF...
              </>
            ) : (
              <>
                <FileCheckIcon size={18} />
                Convert to PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}