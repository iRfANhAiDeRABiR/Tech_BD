"use client";

import { useState, useCallback } from "react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";
import {
  convertImage,
  downloadBlob,
  formatBytes,
  getExtensionFromMime,
  type ImageFormat,
} from "@/lib/imageProcessing";
import styles from "./ImageTool.module.css";

const OUTPUT_FORMATS: { label: string; value: ImageFormat }[] = [
  { label: "PNG", value: "image/png" },
  { label: "JPG", value: "image/jpeg" },
  { label: "WebP", value: "image/webp" },
];

export function ImageConverterClient() {
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>("image/png");
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);

  const handleImageSelect = useCallback((data: ImageFileData) => {
    setImageData(data);
    setResult(null);
    // Default to different format than source
    if (data.format === "PNG") {
      setOutputFormat("image/jpeg");
    } else if (data.format === "JPG") {
      setOutputFormat("image/png");
    } else {
      setOutputFormat("image/png");
    }
  }, []);

  const handleClear = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setImageData(null);
    setResult(null);
  }, [result]);

  const handleConvert = useCallback(async () => {
    if (!imageData) return;
    setProcessing(true);
    try {
      const blob = await convertImage(imageData.url, {
        format: outputFormat,
        quality: quality / 100,
        backgroundColor: outputFormat === "image/jpeg" ? "#ffffff" : undefined,
      });
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
      });
      notify.success("Image converted", {
        description: `Your image is ready to download (${formatBytes(blob.size)}).`,
        id: "img-converted-toast",
      });
    } catch (err) {
      notify.error("Conversion failed", {
        description: getUserFriendlyError(err, "We couldn't convert this image. Please try again."),
        id: "img-convert-error",
      });
    } finally {
      setProcessing(false);
    }
  }, [imageData, outputFormat, quality, result]);

  const handleDownload = useCallback(() => {
    if (!result || !imageData) return;
    const ext = getExtensionFromMime(outputFormat);
    const baseName = imageData.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(result.blob, `${baseName}-converted.${ext}`);
    notify.info("Download started", {
      description: `${baseName}-converted.${ext} is being downloaded.`,
      id: "img-download-toast",
    });
  }, [result, imageData, outputFormat]);

  const handleReset = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  }, [result]);

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
              <img src={result.url} alt="Converted preview" className={styles.previewImage} />
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
                <span className={styles.infoLabel}>Converted:</span>
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
                <span className={styles.statLabel}>Change</span>
                <span className={styles.statValue}>
                  {((result.blob.size - imageData.file.size) / imageData.file.size * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          <h3 className={styles.sectionTitle}>Conversion Settings</h3>

          {/* Output Format */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="convert-format">Output Format</label>
            <select
              id="convert-format"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as ImageFormat)}
              className={styles.selectInput}
            >
              {OUTPUT_FORMATS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
              ))}
            </select>
          </div>

          {/* Quality (for JPEG/WebP) */}
          {outputFormat !== "image/png" && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="convert-quality">
                Quality: {quality}%
              </label>
              <input
                id="convert-quality"
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className={styles.slider}
              />
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted, #94a3b8)", margin: "4px 0 0" }}>
                Lower quality = smaller file size
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleConvert}
              disabled={processing}
            >
              {processing ? "Converting..." : "Convert Image"}
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