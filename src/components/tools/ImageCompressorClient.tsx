"use client";

import { useState, useCallback, useEffect } from "react";
import { Scissors, Download, RotateCcw, Sparkles } from "lucide-react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import {
  compressImage,
  compressPngImage,
  downloadBlob,
  formatBytes,
  getExtensionFromMime,
  type ImageFormat,
} from "@/lib/imageProcessing";
import styles from "./ImageTool.module.css";

export interface CompressionPreset {
  id: string;
  name: string;
  shortLabel: string;
  fromDesc: string;
  targetFormat: ImageFormat;
  accept?: string;
  defaultQuality: number;
  reduceColors?: boolean;
  badge?: string;
  hint: string;
}

export const COMPRESSION_PRESETS: CompressionPreset[] = [
  {
    id: "auto",
    name: "Any Image (Auto)",
    shortLabel: "Any Format",
    fromDesc: "Any Image",
    targetFormat: "image/jpeg",
    defaultQuality: 75,
    hint: "Upload any JPG, PNG, WebP, or GIF image to compress and reduce file size.",
  },
  {
    id: "compress-jpeg",
    name: "Compress JPEG",
    shortLabel: "JPG / JPEG",
    fromDesc: "JPG Photo",
    targetFormat: "image/jpeg",
    accept: "image/jpeg,.jpg,.jpeg",
    defaultQuality: 70,
    badge: "Popular",
    hint: "Compress JPG / JPEG photos with smart quality preservation and file size reduction.",
  },
  {
    id: "png-compressor",
    name: "Compress PNG",
    shortLabel: "PNG",
    fromDesc: "PNG Image",
    targetFormat: "image/png",
    accept: "image/png,.png",
    defaultQuality: 80,
    reduceColors: true,
    badge: "Palette",
    hint: "Compress PNG files up to 70% using 8-bit palette quantization while keeping transparency.",
  },
  {
    id: "webp-compressor",
    name: "Compress WebP",
    shortLabel: "WebP",
    fromDesc: "WebP Image",
    targetFormat: "image/webp",
    accept: "image/webp,.webp",
    defaultQuality: 72,
    badge: "Modern",
    hint: "Compress modern WebP images with high efficiency compression for lightning fast web loading.",
  },
  {
    id: "gif-compressor",
    name: "Compress GIF",
    shortLabel: "GIF",
    fromDesc: "GIF Animation",
    targetFormat: "image/webp",
    accept: "image/gif,.gif",
    defaultQuality: 65,
    badge: "Optimized",
    hint: "Optimize GIF animation or image files to dramatically reduce payload size.",
  },
];

const OUTPUT_FORMATS: { label: string; value: ImageFormat }[] = [
  { label: "JPG (High Compression)", value: "image/jpeg" },
  { label: "WebP (Ultra-Efficient)", value: "image/webp" },
  { label: "PNG (Lossless / Optimized)", value: "image/png" },
];

export interface ImageCompressorClientProps {
  initialPreset?: string;
  initialFormat?: ImageFormat;
  targetFormatLock?: ImageFormat;
  toolTitle?: string;
  toolSubtitle?: string;
  defaultQuality?: number;
  allowedAccept?: string;
}

export function ImageCompressorClient({
  initialPreset,
  initialFormat = "image/jpeg",
  targetFormatLock,
  toolTitle,
  toolSubtitle,
  defaultQuality = 75,
  allowedAccept,
}: ImageCompressorClientProps = {}) {
  // Determine starting preset
  const getStartingPreset = (): CompressionPreset => {
    if (initialPreset) {
      const match = COMPRESSION_PRESETS.find((p) => p.id === initialPreset);
      if (match) return match;
    }
    if (targetFormatLock === "image/png" || initialFormat === "image/png") {
      return COMPRESSION_PRESETS.find((p) => p.id === "png-compressor")!;
    }
    if (targetFormatLock === "image/webp" || initialFormat === "image/webp") {
      return COMPRESSION_PRESETS.find((p) => p.id === "webp-compressor")!;
    }
    return COMPRESSION_PRESETS[0];
  };

  const [activePreset, setActivePreset] = useState<CompressionPreset>(getStartingPreset);
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>(
    targetFormatLock || activePreset.targetFormat
  );
  const [quality, setQuality] = useState(activePreset.defaultQuality || defaultQuality);
  const [reduceColors, setReduceColors] = useState(activePreset.reduceColors ?? true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);

  // Sync client-side URL params if present (e.g. ?preset=png-compressor)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get("preset");
    if (presetParam) {
      const match = COMPRESSION_PRESETS.find((p) => p.id === presetParam);
      if (match) {
        setActivePreset(match);
        setOutputFormat(match.targetFormat);
        setQuality(match.defaultQuality);
        if (match.reduceColors !== undefined) setReduceColors(match.reduceColors);
      }
    }
  }, []);

  const handleSelectPreset = useCallback((preset: CompressionPreset) => {
    setActivePreset(preset);
    setOutputFormat(preset.targetFormat);
    setQuality(preset.defaultQuality);
    if (preset.reduceColors !== undefined) {
      setReduceColors(preset.reduceColors);
    }
    setResult(null);
  }, []);

  const handleImageSelect = useCallback(
    (data: ImageFileData) => {
      setImageData(data);
      setResult(null);
      if (targetFormatLock) {
        setOutputFormat(targetFormatLock);
      } else if (activePreset.id !== "auto") {
        setOutputFormat(activePreset.targetFormat);
      } else if (data.format === "PNG") {
        setOutputFormat("image/png");
      } else {
        setOutputFormat("image/jpeg");
      }
    },
    [activePreset, targetFormatLock]
  );

  const handleClear = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setImageData(null);
    setResult(null);
  }, [result]);

  const handleCompress = useCallback(async () => {
    if (!imageData) return;
    setProcessing(true);

    try {
      let blob: Blob;

      if (outputFormat === "image/png") {
        blob = await compressPngImage(imageData.url, {
          reduceColors,
          quality: quality / 100,
        });
      } else {
        blob = await compressImage(imageData.url, {
          quality: quality / 100,
          format: outputFormat,
        });
      }

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
  }, [imageData, outputFormat, quality, reduceColors, result]);

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

  const savings =
    result && imageData
      ? (((imageData.file.size - result.blob.size) / imageData.file.size) * 100).toFixed(1)
      : null;

  // Presets Bar Component
  const renderPresetsBar = () => (
    <div className={styles.formatPresetBar}>
      <div className={styles.formatPresetHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={15} style={{ color: "#6366f1" }} />
          <h4 className={styles.formatPresetTitle}>Compression Formats</h4>
        </div>
        <p className={styles.presetHint}>{activePreset.hint}</p>
      </div>
      <div className={styles.formatPresetGrid}>
        {COMPRESSION_PRESETS.map((preset) => {
          const isActive = activePreset.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={`${styles.presetChip} ${isActive ? styles.presetChipActive : ""}`}
              onClick={() => handleSelectPreset(preset)}
            >
              <span>{preset.shortLabel}</span>
              {preset.badge && <span className={styles.presetChipBadge}>{preset.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!imageData) {
    const uploadLabel =
      activePreset.id === "auto"
        ? "Upload Image to Compress"
        : `Upload ${activePreset.fromDesc} to Compress`;

    const uploadAccept = activePreset.accept || allowedAccept;

    return (
      <div className={styles.toolContainer}>
        {toolTitle && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{toolTitle}</h2>
            {toolSubtitle && (
              <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)", margin: "6px 0 0" }}>
                {toolSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Format Selector Pills Bar */}
        {renderPresetsBar()}

        <ImageUploader
          onImageSelect={handleImageSelect}
          onClear={handleClear}
          accept={uploadAccept}
          label={uploadLabel}
        />
        <p className={styles.privacyNote}>
          Your images are processed 100% locally in your browser. No files are uploaded to any server.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.toolContainer}>
      {/* Format Selector Pills Bar */}
      {renderPresetsBar()}

      <div className={styles.editorLayout}>
        {/* Preview Section */}
        <div className={styles.previewSection}>
          <h3 className={styles.sectionTitle}>
            {result ? "Compressed Preview" : "Original Preview"}
          </h3>
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
                <span className={styles.infoValue} style={{ color: "#34d399", fontWeight: 700 }}>
                  {formatBytes(result.blob.size)} • {savings}% smaller
                </span>
              </div>
            )}
          </div>

          {result && savings && (
            <div className={styles.resultStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Original</span>
                <span className={styles.statValue}>{formatBytes(imageData.file.size)}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>New Size</span>
                <span className={`${styles.statValue} ${styles.statHighlight}`}>
                  {formatBytes(result.blob.size)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Savings</span>
                <span className={`${styles.statValue} ${styles.statSavings}`}>
                  -{savings}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          <h3 className={styles.sectionTitle}>Compression Settings</h3>

          {/* Format selection */}
          {!targetFormatLock && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Output Format</label>
              <div className={styles.formatGrid}>
                {OUTPUT_FORMATS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`${styles.formatButton} ${outputFormat === f.value ? styles.formatButtonActive : ""}`}
                    onClick={() => {
                      setOutputFormat(f.value);
                      setResult(null);
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality Slider */}
          <div className={styles.controlGroup}>
            <div className={styles.sliderHeader}>
              <label className={styles.controlLabel}>Quality Level</label>
              <span className={styles.sliderValue}>{quality}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              value={quality}
              onChange={(e) => {
                setQuality(Number(e.target.value));
                setResult(null);
              }}
              className={styles.slider}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary, #64748b)", marginTop: 4 }}>
              <span>High Compression (Smaller)</span>
              <span>High Quality (Clearer)</span>
            </div>
          </div>

          {/* PNG Color Reduction Toggle */}
          {outputFormat === "image/png" && (
            <label className={styles.checkboxCard}>
              <input
                type="checkbox"
                id="png-quantize"
                checked={reduceColors}
                onChange={(e) => {
                  setReduceColors(e.target.checked);
                  setResult(null);
                }}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxLabel}>
                Enable Palette Quantization (Cuts PNG size up to 70% with transparency)
              </span>
            </label>
          )}

          {/* Action buttons */}
          <div className={styles.actionButtons}>
            {result ? (
              <>
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  onClick={handleDownload}
                >
                  <Download size={16} />
                  <span>Download Compressed Image</span>
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={handleReset}
                >
                  <RotateCcw size={15} />
                  <span>Adjust Compression</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.buttonPrimary}
                onClick={handleCompress}
                disabled={processing}
              >
                <Scissors size={16} />
                <span>{processing ? "Compressing..." : "Compress Image"}</span>
              </button>
            )}

            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={handleClear}
            >
              Choose Another File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
