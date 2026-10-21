"use client";
import { useState, useCallback } from "react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import {
  blurImage,
  downloadBlob,
  formatBytes,
} from "@/lib/imageProcessing";
import styles from "./ImageTool.module.css";

const BLUR_PRESETS = [
  { label: "Subtle", value: 2 },
  { label: "Light", value: 5 },
  { label: "Medium", value: 10 },
  { label: "Strong", value: 20 },
  { label: "Heavy", value: 40 },
];

export function ImageBlurClient() {
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [blurAmount, setBlurAmount] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);

  const handleImageSelect = useCallback((data: ImageFileData) => {
    setImageData(data);
    setResult(null);
    setBlurAmount(10);
  }, []);

  const handleClear = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setImageData(null);
    setResult(null);
  }, [result]);

  const handleBlur = useCallback(async () => {
    if (!imageData) return;
    setProcessing(true);
    try {
      const blob = await blurImage(imageData.url, {
        amount: blurAmount,
      });
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
      });
      notify.success("Image blurred", {
        description: `Blur effect applied (${formatBytes(blob.size)}).`,
        id: "blur-toast",
      });
    } catch {
      notify.error("Blur failed", {
        description: "Could not apply blur effect to image.",
        id: "blur-toast",
      });
    } finally {
      setProcessing(false);
    }
  }, [imageData, blurAmount, result]);

  const handleDownload = useCallback(() => {
    if (!result || !imageData) return;
    const baseName = imageData.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(result.blob, `${baseName}-blurred.png`);
    notify.info("Download started", {
      description: `${baseName}-blurred.png is downloading.`,
      id: "blur-download-toast",
    });
  }, [result, imageData]);

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
              <img src={result.url} alt="Blurred preview" className={styles.previewImage} />
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
                <span className={styles.infoLabel}>Blurred:</span>
                <span className={styles.infoValue}>
                  {formatBytes(result.blob.size)} • PNG
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          <h3 className={styles.sectionTitle}>Blur Settings</h3>

          {/* Blur Amount Slider */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="blur-amount">
              Blur Strength: {blurAmount}px
            </label>
            <input
              id="blur-amount"
              type="range"
              min="1"
              max="50"
              value={blurAmount}
              onChange={(e) => setBlurAmount(parseInt(e.target.value))}
              className={styles.slider}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
              <span>Subtle</span>
              <span>Heavy</span>
            </div>
          </div>

          {/* Presets */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Quick Presets</label>
            <div className={styles.presetGrid}>
              {BLUR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`${styles.presetButton} ${blurAmount === preset.value ? styles.lockButtonActive : ""}`}
                  onClick={() => setBlurAmount(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleBlur}
              disabled={processing}
            >
              {processing ? "Applying Blur..." : "Apply Blur"}
            </button>
            {result && (
              <>
                <button type="button" className={styles.successButton} onClick={handleDownload}>
                  Download PNG
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