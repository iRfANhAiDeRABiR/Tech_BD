"use client";

import { useCallback, useRef, useState } from "react";
import { notify } from "@/lib/toast";
import styles from "./ImageUploader.module.css";

export interface ImageFileData {
  file: File;
  url: string;
  width: number;
  height: number;
  sizeMB: number;
  format: string;
}

interface ImageUploaderProps {
  onImageSelect: (data: ImageFileData) => void;
  onClear?: () => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  className?: string;
}

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.heic,.heif";
const DEFAULT_MAX_SIZE_MB = 35;

function getFormatFromType(type: string, fileName: string = ""): string {
  const ext = fileName.split(".").pop()?.toUpperCase();
  if (ext === "HEIC" || ext === "HEIF") return "HEIC";
  if (ext === "SVG") return "SVG";
  switch (type) {
    case "image/jpeg":
      return "JPG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WebP";
    case "image/gif":
      return "GIF";
    case "image/svg+xml":
      return "SVG";
    case "image/heic":
    case "image/heif":
      return "HEIC";
    default:
      return ext || type.split("/")[1]?.toUpperCase() || "Unknown";
  }
}

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

export function ImageUploader({
  onImageSelect,
  onClear,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  label = "Upload Image",
  className = "",
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImageFileData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cleanupPreview = useCallback(() => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
    setError(null);
    onClear?.();
  }, [preview, onClear]);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        const msg = `This image is too large (${formatFileSize(file.size)}). Please upload an image smaller than ${maxSizeMB} MB.`;
        setError(msg);
        notify.warning("File too large", {
          description: msg,
          id: "uploader-error",
        });
        return;
      }

      const fileExt = "." + (file.name.split(".").pop()?.toLowerCase() || "");
      const acceptedTypes = accept.split(",").map((s) => s.trim().toLowerCase());
      const isAccepted =
        accept === "*" ||
        acceptedTypes.includes("image/*") ||
        acceptedTypes.includes(file.type.toLowerCase()) ||
        acceptedTypes.includes(fileExt);

      if (!isAccepted && !file.type.startsWith("image/")) {
        const msg = "Please upload an image file (JPG, PNG, WebP, SVG, GIF, or HEIC).";
        setError(msg);
        notify.warning("Unsupported file", {
          description: msg,
          id: "uploader-error",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      const isHeic = fileExt === ".heic" || fileExt === ".heif" || file.type.includes("heic") || file.type.includes("heif");

      if (isHeic) {
        // HEIC is not directly renderable by HTML Image tag in non-Safari browsers
        const data: ImageFileData = {
          file,
          url,
          width: 0,
          height: 0,
          sizeMB,
          format: "HEIC",
        };
        setPreview(data);
        onImageSelect(data);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const data: ImageFileData = {
          file,
          url,
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
          sizeMB,
          format: getFormatFromType(file.type, file.name),
        };
        setPreview(data);
        onImageSelect(data);
      };
      img.onerror = () => {
        // Fallback for SVGs or unusual formats
        const data: ImageFileData = {
          file,
          url,
          width: 800,
          height: 800,
          sizeMB,
          format: getFormatFromType(file.type, file.name),
        };
        setPreview(data);
        onImageSelect(data);
      };
      img.src = url;
    },
    [accept, maxSizeMB, onImageSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    },
    [processFile]
  );

  const handleReplace = useCallback(() => {
    cleanupPreview();
    inputRef.current?.click();
  }, [cleanupPreview]);

  const handleRemove = useCallback(() => {
    cleanupPreview();
    if (inputRef.current) inputRef.current.value = "";
  }, [cleanupPreview]);

  if (preview) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.previewWrapper}>
          <div className={styles.previewImageContainer}>
            {preview.format === "HEIC" ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.05)",
                  color: "#94a3b8",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                }}
              >
                Apple HEIC / HEIF Photo
              </div>
            ) : (
              <img
                src={preview.url}
                alt="Uploaded preview"
                className={styles.previewImage}
              />
            )}
          </div>
          <div className={styles.previewInfo}>
            <span className={styles.fileName}>{preview.file.name}</span>
            <span className={styles.fileMeta}>
              {preview.width > 0 ? `${preview.width} × ${preview.height} • ` : ""}
              {formatFileSize(preview.file.size)} • {preview.format}
            </span>
          </div>
          <div className={styles.previewActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleReplace}
            >
              Replace
            </button>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className={styles.hiddenInput}
          aria-label="Choose image file"
        />
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <div
        className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${label}. Drag and drop or click to choose.`}
      >
        <div className={styles.dropzoneContent}>
          <svg
            className={styles.uploadIcon}
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className={styles.dropTitle}>{label}</p>
          <p className={styles.dropSubtitle}>
            Drag & drop your image here or click to browse
          </p>
          <p className={styles.dropFormats}>JPG, PNG, WebP, SVG, GIF, HEIC supported</p>
        </div>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className={styles.hiddenInput}
        aria-label="Choose image file"
      />
    </div>
  );
}
