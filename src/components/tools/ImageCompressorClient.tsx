"use client";

import { useState, useCallback } from "react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import {
  compressImage,
  downloadBlob,
  formatBytes,
  getExtensionFromMime,
  type ImageFormat,
} from "@/lib/imageProcessing";
import styles from "./ImageTool.module.css";

const OUTPUT_FORMATS: { label: string; value: ImageFormat }[] = [
  { label: "JPG (Best compression)", value: "image/jpeg" },
  { label: "WebP (Modern format)", value: "image/webp" },
  { label: "PNG (Lossless)", value: "image/png" },
];

export function ImageCompressorClient() {
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>("image/jpeg");
  const [quality, setQuality] = useState(75);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);

  const handleImageSelect = useCallback((data: ImageFileData) => {
    setImageData(data);
    setResult(null);
    // Default to JPEG for best compression
    setOutputFormat("image/jpeg");
    setQuality(75);
  }, []);

  const handleClear = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setImageData(null);
    setResult(null);
  }, [result]);

  const handleCompress = useCallback(async () => {
    if (!imageData) return;
    setProcessing(true);
    try {
      const blob = await compressImage(imageData.url, {
        quality: quality / 100,
        format: outputFormat,
      });
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
      });
      const savedPct = ((imageData.file.size - blob.size) / imageData.file.size * 100).toFixed(0);
      notify.success("Image compressed", {
        description: `Size reduced by ${savedPct}% (${formatBytes(imageData.file.size)} → ${formatBytes(blob.size)}).`,
        id: "compressor-toast",
      });
    } catch {
      notify.error("Compression failed", {
        description: "Could not compress the image. Please try again.",
        id: "compressor-toast",
      });
    } finally {
      setProcessing(false);
    }
  }, [imageData, outputFormat, quality, result]);

  const handleDownload = useCallback(() => {
    if (!result || !imageData) return;
    const ext = getExtensionFromMime(outputFormat);
    const baseName = imageData.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(result.blob, `${baseName}-compressed.${ext}`);
    notify.info("Download started", {
      description: `${baseName}-compressed.${ext} is downloading.`,
      id: "compressor-download-toast",
    });
  }, [result, imageData, outputFormat]);

  const handleReset = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  }, [result]);

  const savings = result && imageData
    ? ((imageData.file.size - result.blob.size) / imageData.file.size * 100).toFixed(1)
    : null;

  if (!imageData) {
    return (
      <div className={styles.toolContainer}>
        <ImageUploader onImageSelect={handleImageSelect} onClear={handleClear} />
        <p className={styles.privacyNote}>
          Your images are processed locally in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.toolContainer}>
      <div className={styles.editorLayout}>
        {/* Preview Section */}
        <div className={styles.previewSection}>
          <h3 className={styles.sectionTitle}>Preview</h3>
          <div className={styles.previewArea}>
            {result ? (
              <img src={result.url} alt="Compressed preview" className={styles.previewImage} />
            ) : (
              <img src={imageData.url} alt="Original preview" className={styles.previewImage} />
            )}
          </div>
          <div className={styles.imageInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Original:</span>
              <span className={styles.infoValue}>
                {imageData.width} × {imageData.height} • {formatBytes(imageData.file.size)} • {imageData.format}
              </span>
            </div>
            {result && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Compressed:</span>
                <span className={styles.infoValue}>
                  {formatBytes(result.blob.size)} • {getExtensionFromMime(outputFormat).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {result && (
            <div className={styles.resultStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Original Size</span>
                <span className={styles.statValue}>{formatBytes(imageData.file.size)}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>New Size</span>
                <span className={`${styles.statValue} ${styles.statHighlight}`}>
                  {formatBytes(result.blob.size)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Saved</span>
                <span className={`${styles.statValue} ${styles.statHighlight}`}>
                  {savings}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          <h3 className={styles.sectionTitle}>Compression Settings</h3>

          {/* Output Format */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="compress-format">Output Format</label>
            <select
              id="compress-format"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as ImageFormat)}
              className={styles.selectInput}
            >
              {OUTPUT_FORMATS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
              ))}
            </select>
          </div>

          {/* Quality Slider */}
          {outputFormat !== "image/png" && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="compress-quality">
                Quality: {quality}%
              </label>
              <input
                id="compress-quality"
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className={styles.slider}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          )}

          {outputFormat === "image/png" && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #94a3b8)", margin: 0 }}>
              PNG is lossless. For better compression, try JPG or WebP.
            </p>
          )}

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleCompress}
              disabled={processing}
            >
              {processing ? "Compressing..." : "Compress Image"}
            </button>
            {result && (
              <>
                <button type="button" className={styles.successButton} onClick={handleDownload}>
                  Download {getExtensionFromMime(outputFormat).toUpperCase()}
                </button>
                <button type="button" className={styles.secondaryButton} onClick={handleReset}>
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <ImageUploader onImageSelect={handleImageSelect} onClear={handleClear} className={styles.replaceUpload} />
    </div>
  );
}