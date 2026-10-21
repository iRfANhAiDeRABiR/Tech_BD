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

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp";
const DEFAULT_MAX_SIZE_MB = 20;

function getFormatFromType(type: string): string {
  switch (type) {
    case "image/jpeg":
      return "JPG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WebP";
    case "image/gif":
      return "GIF";
    default:
      return type.split("/")[1]?.toUpperCase() || "Unknown";
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

      const acceptedTypes = accept.split(",");
      if (!acceptedTypes.includes(file.type)) {
        const msg = "Please upload a JPG, PNG, or WebP image.";
        setError(msg);
        notify.warning("Unsupported file", {
          description: msg,
          id: "uploader-error",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const data: ImageFileData = {
          file,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeMB,
          format: getFormatFromType(file.type),
        };
        setPreview(data);
        onImageSelect(data);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const msg = "We couldn't process this image. Please try another file.";
        setError(msg);
        notify.error("Processing failed", {
          description: msg,
          id: "uploader-error",
        });
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
            <img
              src={preview.url}
              alt="Uploaded preview"
              className={styles.previewImage}
            />
          </div>
          <div className={styles.previewInfo}>
            <span className={styles.fileName}>{preview.file.name}</span>
            <span className={styles.fileMeta}>
              {preview.width} × {preview.height} •{" "}
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
          <p className={styles.dropFormats}>JPG, PNG, WebP supported</p>
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