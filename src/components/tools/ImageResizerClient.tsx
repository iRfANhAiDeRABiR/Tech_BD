"use client";

import { useState, useCallback } from "react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import {
  resizeImage,
  downloadBlob,
  formatBytes,
  getExtensionFromMime,
} from "@/lib/imageProcessing";
import styles from "./ImageTool.module.css";

const PRESETS = [
  { label: "Original", width: 0, height: 0 },
  { label: "50%", width: -50, height: -50 },
  { label: "75%", width: -75, height: -75 },
  { label: "Instagram Post", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "Facebook Post", width: 1200, height: 630 },
  { label: "HD", width: 1280, height: 720 },
  { label: "Full HD", width: 1920, height: 1080 },
];

const OUTPUT_FORMATS = [
  { label: "PNG", value: "image/png" as const },
  { label: "JPG", value: "image/jpeg" as const },
  { label: "WebP", value: "image/webp" as const },
];

export function ImageResizerClient() {
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [outputFormat, setOutputFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string; width: number; height: number } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  const handleImageSelect = useCallback((data: ImageFileData) => {
    setImageData(data);
    setWidth(data.width);
    setHeight(data.height);
    setAspectRatio(data.width / data.height);
    setResult(null);
  }, []);

  const handleClear = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setImageData(null);
    setResult(null);
    setWidth(0);
    setHeight(0);
  }, [result]);

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      if (newWidth < 1) return;
      setWidth(newWidth);
      if (lockAspect && aspectRatio > 0) {
        setHeight(Math.round(newWidth / aspectRatio));
      }
    },
    [lockAspect, aspectRatio]
  );

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      if (newHeight < 1) return;
      setHeight(newHeight);
      if (lockAspect && aspectRatio > 0) {
        setWidth(Math.round(newHeight * aspectRatio));
      }
    },
    [lockAspect, aspectRatio]
  );

  const applyPreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      if (!imageData) return;
      if (preset.width === 0 && preset.height === 0) {
        setWidth(imageData.width);
        setHeight(imageData.height);
      } else if (preset.width < 0) {
        const pct = Math.abs(preset.width) / 100;
        setWidth(Math.round(imageData.width * pct));
        setHeight(Math.round(imageData.height * pct));
      } else {
        setWidth(preset.width);
        if (lockAspect) {
          setHeight(Math.round(preset.width / aspectRatio));
        } else {
          setHeight(preset.height);
        }
      }
    },
    [imageData, lockAspect, aspectRatio]
  );

  const handleResize = useCallback(async () => {
    if (!imageData || width < 1 || height < 1) return;
    setProcessing(true);
    try {
      const blob = await resizeImage(imageData.url, {
        width,
        height,
        maintainAspectRatio: false,
      });

      // Convert to selected output format if needed
      let finalBlob = blob;
      if (outputFormat !== "image/png") {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await new Promise<void>((resolve) => {
          img.onload = () => {
            if (outputFormat === "image/jpeg") {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0);
            resolve();
          };
        });
        URL.revokeObjectURL(img.src);
        finalBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (b) => resolve(b!),
            outputFormat,
            quality / 100
          );
        });
      }

      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob: finalBlob,
        url: URL.createObjectURL(finalBlob),
        width,
        height,
      });
      notify.success("Image resized", {
        description: `Image resized to ${width} × ${height} (${formatBytes(finalBlob.size)}).`,
        id: "resizer-toast",
      });
    } catch {
      notify.error("Resizing failed", {
        description: "Could not resize the image. Please try again.",
        id: "resizer-toast",
      });
    } finally {
      setProcessing(false);
    }
  }, [imageData, width, height, outputFormat, quality, result]);

  const handleDownload = useCallback(() => {
    if (!result || !imageData) return;
    const ext = getExtensionFromMime(outputFormat);
    const baseName = imageData.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(result.blob, `${baseName}-resized.${ext}`);
    notify.info("Download started", {
      description: `${baseName}-resized.${ext} is downloading.`,
      id: "resizer-download-toast",
    });
  }, [result, imageData, outputFormat]);

  const handleReset = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    if (imageData) {
      setWidth(imageData.width);
      setHeight(imageData.height);
    }
  }, [result, imageData]);

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
              <img src={result.url} alt="Resized preview" className={styles.previewImage} />
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
                  {result.width} × {result.height} • {formatBytes(result.blob.size)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          <h3 className={styles.sectionTitle}>Resize Settings</h3>

          {/* Dimensions */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Dimensions</label>
            <div className={styles.dimensionInputs}>
              <div className={styles.dimensionInput}>
                <label htmlFor="resize-width">Width (px)</label>
                <input
                  id="resize-width"
                  type="number"
                  min="1"
                  max="10000"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                />
              </div>
              <button
                type="button"
                className={`${styles.lockButton} ${lockAspect ? styles.lockButtonActive : ""}`}
                onClick={() => setLockAspect(!lockAspect)}
                title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
                aria-label={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
              >
                {lockAspect ? "🔒" : "🔓"}
              </button>
              <div className={styles.dimensionInput}>
                <label htmlFor="resize-height">Height (px)</label>
                <input
                  id="resize-height"
                  type="number"
                  min="1"
                  max="10000"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Quick Presets</label>
            <div className={styles.presetGrid}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={styles.presetButton}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Output Format */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="output-format">Output Format</label>
            <select
              id="output-format"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as typeof outputFormat)}
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
              <label className={styles.controlLabel} htmlFor="quality-slider">
                Quality: {quality}%
              </label>
              <input
                id="quality-slider"
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className={styles.slider}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleResize}
              disabled={processing || width < 1 || height < 1}
            >
              {processing ? "Processing..." : "Resize Image"}
            </button>
            {result && (
              <>
                <button type="button" className={styles.successButton} onClick={handleDownload}>
                  Download Image
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