"use client";
import { useState, useCallback } from "react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import {
  addWatermark,
  downloadBlob,
  formatBytes,
  type WatermarkPosition,
} from "@/lib/imageProcessing";
import styles from "./ImageTool.module.css";

const POSITION_OPTIONS: { label: string; value: WatermarkPosition }[] = [
  { label: "Top Left", value: "top-left" },
  { label: "Top Center", value: "top-center" },
  { label: "Top Right", value: "top-right" },
  { label: "Center Left", value: "center-left" },
  { label: "Center", value: "center" },
  { label: "Center Right", value: "center-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Bottom Center", value: "bottom-center" },
  { label: "Bottom Right", value: "bottom-right" },
];

const COLOR_PRESETS = [
  { label: "White", value: "#FFFFFF" },
  { label: "Black", value: "#000000" },
  { label: "Red", value: "#FF0000" },
  { label: "Yellow", value: "#FFFF00" },
  { label: "Cyan", value: "#00FFFF" },
];

export function WatermarkClient() {
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [text, setText] = useState("TechBD");
  const [fontSize, setFontSize] = useState(10); // percentage relative to image
  const [color, setColor] = useState("#FFFFFF");
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [rotation, setRotation] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);

  const handleImageSelect = useCallback((data: ImageFileData) => {
    setImageData(data);
    setResult(null);
  }, []);

  const handleClear = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setImageData(null);
    setResult(null);
  }, [result]);

  const handleApply = useCallback(async () => {
    if (!imageData || !text.trim()) return;
    setProcessing(true);
    try {
      const blob = await addWatermark(imageData.url, {
        text: text.trim(),
        fontSize,
        color,
        opacity,
        position,
        rotation,
      });
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
      });
      notify.success("Watermark applied", {
        description: `Watermark added successfully (${formatBytes(blob.size)}).`,
        id: "watermark-toast",
      });
    } catch {
      notify.error("Watermark failed", {
        description: "Could not apply watermark to the image.",
        id: "watermark-toast",
      });
    } finally {
      setProcessing(false);
    }
  }, [imageData, text, fontSize, color, opacity, position, rotation, result]);

  const handleDownload = useCallback(() => {
    if (!result || !imageData) return;
    const baseName = imageData.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(result.blob, `${baseName}-watermarked.png`);
    notify.info("Download started", {
      description: `${baseName}-watermarked.png is downloading.`,
      id: "watermark-download-toast",
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
              <img src={result.url} alt="Watermarked preview" className={styles.previewImage} />
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
                <span className={styles.infoLabel}>Result:</span>
                <span className={styles.infoValue}>
                  {formatBytes(result.blob.size)} • PNG
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          <h3 className={styles.sectionTitle}>Watermark Settings</h3>

          {/* Text Input */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="wm-text">
              Watermark Text
            </label>
            <input
              id="wm-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter watermark text"
              className={styles.textInput}
              maxLength={50}
            />
          </div>

          {/* Font Size Slider */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="wm-size">
              Size: {fontSize}%
            </label>
            <input
              id="wm-size"
              type="range"
              min="1"
              max="30"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className={styles.slider}
            />
          </div>

          {/* Opacity Slider */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="wm-opacity">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              id="wm-opacity"
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className={styles.slider}
            />
          </div>

          {/* Rotation Slider */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="wm-rotation">
              Rotation: {rotation}°
            </label>
            <input
              id="wm-rotation"
              type="range"
              min="-180"
              max="180"
              step="5"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className={styles.slider}
            />
          </div>

          {/* Color Selection */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Color</label>
            <div className={styles.presetGrid}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.presetButton} ${color === c.value ? styles.lockButtonActive : ""}`}
                  onClick={() => setColor(c.value)}
                  style={{
                    backgroundColor: c.value,
                    color: c.value === "#FFFFFF" || c.value === "#FFFF00" || c.value === "#00FFFF" ? "#000" : "#FFF",
                    border: color === c.value ? "2px solid var(--accent-color, #8B5CF6)" : "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position Selection */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="wm-position">
              Position
            </label>
            <select
              id="wm-position"
              value={position}
              onChange={(e) => setPosition(e.target.value as WatermarkPosition)}
              className={styles.selectInput}
            >
              {POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleApply}
              disabled={processing || !text.trim()}
            >
              {processing ? "Applying Watermark..." : "Apply Watermark"}
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