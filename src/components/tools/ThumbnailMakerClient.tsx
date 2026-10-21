"use client";
import { useState, useCallback } from "react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import {
  generateThumbnail,
  downloadBlob,
  formatBytes,
} from "@/lib/imageProcessing";
import styles from "./ImageTool.module.css";

const THUMBNAIL_PRESETS = [
  { label: "YouTube", width: 1280, height: 720 },
  { label: "Instagram Post", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Twitter/X", width: 1200, height: 675 },
  { label: "Facebook", width: 1200, height: 630 },
  { label: "Custom", width: 0, height: 0 },
];

export function ThumbnailMakerClient() {
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [title, setTitle] = useState("");
  const [presetIndex, setPresetIndex] = useState(0);
  const [customWidth, setCustomWidth] = useState(1280);
  const [customHeight, setCustomHeight] = useState(720);
  const [fontSize, setFontSize] = useState(0); // 0 = auto
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [position, setPosition] = useState<"center" | "bottom">("center");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);

  const selectedPreset = THUMBNAIL_PRESETS[presetIndex];
  const targetWidth = selectedPreset.width || customWidth;
  const targetHeight = selectedPreset.height || customHeight;

  const handleImageSelect = useCallback((data: ImageFileData) => {
    setImageData(data);
    setResult(null);
  }, []);

  const handleClear = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setImageData(null);
    setResult(null);
  }, [result]);

  const handleGenerate = useCallback(async () => {
    if (!imageData || !title.trim()) return;
    setProcessing(true);
    try {
      const blob = await generateThumbnail(imageData.url, {
        title: title.trim(),
        width: targetWidth,
        height: targetHeight,
        fontSize: fontSize || undefined,
        textColor,
        overlayOpacity,
        position,
      });
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
      });
      notify.success("Thumbnail generated", {
        description: `Thumbnail created successfully (${formatBytes(blob.size)}).`,
        id: "thumbnail-toast",
      });
    } catch {
      notify.error("Generation failed", {
        description: "Could not generate thumbnail. Please try again.",
        id: "thumbnail-toast",
      });
    } finally {
      setProcessing(false);
    }
  }, [imageData, title, targetWidth, targetHeight, fontSize, textColor, overlayOpacity, position, result]);

  const handleDownload = useCallback(() => {
    if (!result || !imageData) return;
    const baseName = imageData.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(result.blob, `${baseName}-thumbnail.png`);
    notify.info("Download started", {
      description: `${baseName}-thumbnail.png is downloading.`,
      id: "thumbnail-download-toast",
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
              <img src={result.url} alt="Thumbnail preview" className={styles.previewImage} />
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
                  {targetWidth} × {targetHeight} • {formatBytes(result.blob.size)} • PNG
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          <h3 className={styles.sectionTitle}>Thumbnail Settings</h3>

          {/* Title Input */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="thumb-title">
              Title Text
            </label>
            <input
              id="thumb-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter thumbnail title"
              className={styles.textInput}
              maxLength={100}
            />
          </div>

          {/* Size Preset */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Size Preset</label>
            <div className={styles.presetGrid}>
              {THUMBNAIL_PRESETS.map((preset, idx) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`${styles.presetButton} ${presetIndex === idx ? styles.lockButtonActive : ""}`}
                  onClick={() => setPresetIndex(idx)}
                >
                  {preset.label}
                  {preset.width > 0 && (
                    <span style={{ display: "block", fontSize: "0.7rem", opacity: 0.7 }}>
                      {preset.width}×{preset.height}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size Inputs */}
          {selectedPreset.label === "Custom" && (
            <div className={styles.controlGroup}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.controlLabel} htmlFor="thumb-width">Width</label>
                  <input
                    id="thumb-width"
                    type="number"
                    min="100"
                    max="4096"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1280)}
                    className={styles.textInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.controlLabel} htmlFor="thumb-height">Height</label>
                  <input
                    id="thumb-height"
                    type="number"
                    min="100"
                    max="4096"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 720)}
                    className={styles.textInput}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Position */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Text Position</label>
            <div className={styles.presetGrid}>
              <button
                type="button"
                className={`${styles.presetButton} ${position === "center" ? styles.lockButtonActive : ""}`}
                onClick={() => setPosition("center")}
              >
                Center
              </button>
              <button
                type="button"
                className={`${styles.presetButton} ${position === "bottom" ? styles.lockButtonActive : ""}`}
                onClick={() => setPosition("bottom")}
              >
                Bottom
              </button>
            </div>
          </div>

          {/* Font Size Slider */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="thumb-fontsize">
              Font Size: {fontSize === 0 ? "Auto" : `${fontSize}px`}
            </label>
            <input
              id="thumb-fontsize"
              type="range"
              min="0"
              max="200"
              step="4"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className={styles.slider}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
              <span>Auto</span>
              <span>Large</span>
            </div>
          </div>

          {/* Overlay Opacity Slider */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="thumb-overlay">
              Overlay Darkness: {Math.round(overlayOpacity * 100)}%
            </label>
            <input
              id="thumb-overlay"
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              className={styles.slider}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
              <span>None</span>
              <span>Dark</span>
            </div>
          </div>

          {/* Text Color */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Text Color</label>
            <div className={styles.presetGrid}>
              {[
                { label: "White", value: "#FFFFFF" },
                { label: "Black", value: "#000000" },
                { label: "Yellow", value: "#FFFF00" },
                { label: "Red", value: "#FF0000" },
                { label: "Lime", value: "#00FF00" },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.presetButton} ${textColor === c.value ? styles.lockButtonActive : ""}`}
                  onClick={() => setTextColor(c.value)}
                  style={{
                    backgroundColor: c.value,
                    color: c.value === "#FFFFFF" || c.value === "#FFFF00" || c.value === "#00FF00" ? "#000" : "#FFF",
                    border: textColor === c.value ? "2px solid var(--accent-color, #0EA5E9)" : "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleGenerate}
              disabled={processing || !title.trim()}
            >
              {processing ? "Generating Thumbnail..." : "Generate Thumbnail"}
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