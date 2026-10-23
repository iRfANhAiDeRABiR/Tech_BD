"use client";

import { useState, useCallback, useEffect } from "react";
import { RefreshCw, Download, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";
import {
  convertImage,
  downloadBlob,
  formatBytes,
  getExtensionFromMime,
  type ImageFormat,
  heicToJpg,
  rasterToSvg,
  svgToRaster,
} from "@/lib/imageProcessing";
import styles from "./ImageTool.module.css";

export type ExtendedImageFormat = ImageFormat | "image/svg+xml";

export interface ConversionPreset {
  id: string;
  name: string;
  shortLabel: string;
  fromDesc: string;
  toDesc: string;
  targetFormat: ExtendedImageFormat;
  mode: "standard" | "heic" | "svg-raster" | "png-to-svg";
  accept?: string;
  defaultQuality?: number;
  badge?: string;
  hint: string;
}

export const CONVERSION_PRESETS: ConversionPreset[] = [
  {
    id: "auto",
    name: "Any to Any Format",
    shortLabel: "Any Format",
    fromDesc: "Any Image",
    toDesc: "Any Format",
    targetFormat: "image/png",
    mode: "standard",
    accept: undefined,
    hint: "Upload any image (PNG, JPG, WebP, SVG, HEIC, GIF) and choose any target format.",
  },
  {
    id: "png-to-jpg",
    name: "PNG to JPG",
    shortLabel: "PNG → JPG",
    fromDesc: "PNG",
    toDesc: "JPG",
    targetFormat: "image/jpeg",
    mode: "standard",
    accept: "image/png,.png",
    defaultQuality: 90,
    badge: "Popular",
    hint: "Convert transparent PNG files to compact, universal JPG images with clean background.",
  },
  {
    id: "jpg-to-png",
    name: "JPG to PNG",
    shortLabel: "JPG → PNG",
    fromDesc: "JPG",
    toDesc: "PNG",
    targetFormat: "image/png",
    mode: "standard",
    accept: "image/jpeg,.jpg,.jpeg",
    badge: "Lossless",
    hint: "Convert JPG photos into lossless PNG format with transparency support.",
  },
  {
    id: "heic-to-jpg",
    name: "HEIC to JPG",
    shortLabel: "HEIC → JPG",
    fromDesc: "Apple HEIC",
    toDesc: "JPG",
    targetFormat: "image/jpeg",
    mode: "heic",
    accept: ".heic,.heif,image/heic,image/heif",
    defaultQuality: 92,
    badge: "iPhone",
    hint: "Convert Apple iPhone HEIC / HEIF live photos into universal high-quality JPG.",
  },
  {
    id: "webp-to-png",
    name: "WebP to PNG",
    shortLabel: "WebP → PNG",
    fromDesc: "WebP",
    toDesc: "PNG",
    targetFormat: "image/png",
    mode: "standard",
    accept: "image/webp,.webp",
    badge: "Alpha",
    hint: "Convert WebP images into lossless PNG preserving transparent channels.",
  },
  {
    id: "webp-to-jpg",
    name: "WebP to JPG",
    shortLabel: "WebP → JPG",
    fromDesc: "WebP",
    toDesc: "JPG",
    targetFormat: "image/jpeg",
    mode: "standard",
    accept: "image/webp,.webp",
    defaultQuality: 90,
    hint: "Convert modern WebP images into standard JPG format for older software and social sharing.",
  },
  {
    id: "png-to-svg",
    name: "PNG to SVG",
    shortLabel: "PNG → SVG",
    fromDesc: "Raster PNG",
    toDesc: "Vector SVG",
    targetFormat: "image/svg+xml",
    mode: "png-to-svg",
    accept: "image/png,.png,image/jpeg,.jpg",
    badge: "Vector",
    hint: "Vectorize raster PNG pixels into infinitely scalable SVG vector shapes.",
  },
  {
    id: "svg-to-png",
    name: "SVG to PNG",
    shortLabel: "SVG → PNG",
    fromDesc: "Vector SVG",
    toDesc: "PNG",
    targetFormat: "image/png",
    mode: "svg-raster",
    accept: "image/svg+xml,.svg",
    hint: "Render vector SVG graphics into crisp, high-resolution PNG images.",
  },
  {
    id: "gif-converter",
    name: "GIF to PNG/JPG",
    shortLabel: "GIF Converter",
    fromDesc: "GIF",
    toDesc: "PNG",
    targetFormat: "image/png",
    mode: "standard",
    accept: "image/gif,.gif",
    hint: "Extract and convert GIF animations or images into static PNG or JPG format.",
  },
];

export interface ImageConverterClientProps {
  initialPreset?: string;
  initialTargetFormat?: ExtendedImageFormat;
  lockTargetFormat?: boolean;
  toolTitle?: string;
  toolSubtitle?: string;
  mode?: "standard" | "heic" | "svg-raster" | "png-to-svg";
  allowedAccept?: string;
}

const OUTPUT_FORMATS: { label: string; value: ExtendedImageFormat }[] = [
  { label: "JPG (High Compatibility)", value: "image/jpeg" },
  { label: "PNG (Lossless Transparency)", value: "image/png" },
  { label: "WebP (Modern Standard)", value: "image/webp" },
  { label: "SVG (Scalable Vector)", value: "image/svg+xml" },
];

export function ImageConverterClient({
  initialPreset,
  initialTargetFormat = "image/png",
  lockTargetFormat = false,
  toolTitle,
  toolSubtitle,
  mode = "standard",
  allowedAccept,
}: ImageConverterClientProps = {}) {
  // Determine starting preset
  const getStartingPreset = (): ConversionPreset => {
    if (initialPreset) {
      const match = CONVERSION_PRESETS.find((p) => p.id === initialPreset);
      if (match) return match;
    }
    if (mode === "heic") return CONVERSION_PRESETS.find((p) => p.id === "heic-to-jpg")!;
    if (mode === "png-to-svg") return CONVERSION_PRESETS.find((p) => p.id === "png-to-svg")!;
    if (mode === "svg-raster") return CONVERSION_PRESETS.find((p) => p.id === "svg-to-png")!;
    if (initialTargetFormat === "image/jpeg") return CONVERSION_PRESETS.find((p) => p.id === "png-to-jpg")!;
    return CONVERSION_PRESETS[0];
  };

  const [activePreset, setActivePreset] = useState<ConversionPreset>(getStartingPreset);
  const [currentMode, setCurrentMode] = useState<"standard" | "heic" | "svg-raster" | "png-to-svg">(
    activePreset.mode
  );
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [outputFormat, setOutputFormat] = useState<ExtendedImageFormat>(activePreset.targetFormat);
  const [quality, setQuality] = useState(activePreset.defaultQuality || 90);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string; isSvgText?: boolean } | null>(null);

  // Sync client-side URL params if present (e.g. ?preset=heic-to-jpg)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get("preset");
    if (presetParam) {
      const match = CONVERSION_PRESETS.find((p) => p.id === presetParam);
      if (match) {
        setActivePreset(match);
        setOutputFormat(match.targetFormat);
        setCurrentMode(match.mode);
        if (match.defaultQuality) setQuality(match.defaultQuality);
      }
    }
  }, []);

  const handleSelectPreset = useCallback((preset: ConversionPreset) => {
    setActivePreset(preset);
    setOutputFormat(preset.targetFormat);
    setCurrentMode(preset.mode);
    if (preset.defaultQuality) {
      setQuality(preset.defaultQuality);
    }
    setResult(null);
  }, []);

  const handleImageSelect = useCallback(
    (data: ImageFileData) => {
      setImageData(data);
      setResult(null);

      // If active preset has a specific target, preserve it; otherwise pick complementary format
      if (activePreset.id !== "auto") {
        setOutputFormat(activePreset.targetFormat);
      } else if (data.format === "PNG") {
        setOutputFormat("image/jpeg");
      } else if (data.format === "JPG") {
        setOutputFormat("image/png");
      } else {
        setOutputFormat("image/png");
      }
    },
    [activePreset]
  );

  const handleClear = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setImageData(null);
    setResult(null);
  }, [result]);

  const handleConvert = useCallback(async () => {
    if (!imageData) return;
    setProcessing(true);

    try {
      let finalBlob: Blob;

      const isHeicInput =
        currentMode === "heic" ||
        imageData.format === "HEIC" ||
        imageData.file.name.toLowerCase().endsWith(".heic") ||
        imageData.file.name.toLowerCase().endsWith(".heif");

      const isSvgInput =
        imageData.format === "SVG" ||
        imageData.file.name.toLowerCase().endsWith(".svg") ||
        imageData.file.type.includes("svg");

      if (isHeicInput) {
        // 1. HEIC Conversion (iPhone Photos)
        finalBlob = await heicToJpg(imageData.file, {
          quality: quality / 100,
        });
      } else if (outputFormat === "image/svg+xml" || currentMode === "png-to-svg") {
        // 2. Vectorize / Convert to SVG
        const svgString = await rasterToSvg(imageData.url, {
          mode: "vector",
          threshold: 135,
        });
        finalBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      } else if (isSvgInput) {
        // 3. SVG to Raster (PNG / JPG / WebP)
        finalBlob = await svgToRaster(imageData.url, {
          format: outputFormat as ImageFormat,
          scale: 2,
          quality: quality / 100,
          backgroundColor: outputFormat === "image/jpeg" ? "#ffffff" : undefined,
        });
      } else {
        // 4. Standard Raster Image Conversion (Canvas API)
        finalBlob = await convertImage(imageData.url, {
          format: outputFormat as ImageFormat,
          quality: quality / 100,
          backgroundColor: outputFormat === "image/jpeg" ? "#ffffff" : undefined,
        });
      }

      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob: finalBlob,
        url: URL.createObjectURL(finalBlob),
      });

      notify.success("Image converted", {
        description: `Your image is ready to download (${formatBytes(finalBlob.size)}).`,
        id: "img-converted-toast",
      });
    } catch (err) {
      console.error("Conversion error:", err);
      notify.error("Conversion failed", {
        description: getUserFriendlyError(err, "We couldn't convert this image. Please try again."),
        id: "img-convert-error",
      });
    } finally {
      setProcessing(false);
    }
  }, [imageData, currentMode, outputFormat, quality, result]);

  const handleDownload = useCallback(() => {
    if (!result || !imageData) return;
    let ext = "png";
    if (outputFormat === "image/svg+xml") {
      ext = "svg";
    } else {
      ext = getExtensionFromMime(outputFormat as ImageFormat);
    }
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

  const targetExt =
    outputFormat === "image/svg+xml"
      ? "SVG"
      : getExtensionFromMime(outputFormat as ImageFormat).toUpperCase();

  // Presets Bar Component
  const renderPresetsBar = () => (
    <div className={styles.formatPresetBar}>
      <div className={styles.formatPresetHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={15} style={{ color: "#6366f1" }} />
          <h4 className={styles.formatPresetTitle}>Conversion Formats</h4>
        </div>
        <p className={styles.presetHint}>{activePreset.hint}</p>
      </div>
      <div className={styles.formatPresetGrid}>
        {CONVERSION_PRESETS.map((preset) => {
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
        ? "Upload Image to Convert"
        : `Upload ${activePreset.fromDesc} (Converts to ${activePreset.toDesc})`;

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
          Your images are processed 100% locally in your browser. Complete privacy guaranteed.
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className={styles.sectionTitle}>
              {result ? "Converted Preview" : "Source Preview"}
            </h3>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#6366f1",
                background: "rgba(99,102,241,0.12)",
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              {imageData.format} <ArrowRight size={12} style={{ display: "inline" }} /> {targetExt}
            </span>
          </div>

          <div className={styles.previewArea}>
            {result ? (
              <img src={result.url} alt="Converted preview" className={styles.previewImage} />
            ) : imageData.format === "HEIC" ? (
              <div style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                <div style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>
                  Apple HEIC Image Selected
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Ready to convert to high-compatibility {targetExt}
                </div>
              </div>
            ) : (
              <img src={imageData.url} alt="Original preview" className={styles.previewImage} />
            )}
          </div>

          <div className={styles.imageInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Original:</span>
              <span className={styles.infoValue}>
                {imageData.width > 0 ? `${imageData.width} × ${imageData.height} • ` : ""}
                {formatBytes(imageData.file.size)} • {imageData.format}
              </span>
            </div>
            {result && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Converted:</span>
                <span className={styles.infoValue} style={{ color: "#34d399", fontWeight: 700 }}>
                  {formatBytes(result.blob.size)} • {targetExt}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          <h3 className={styles.sectionTitle}>Conversion Options</h3>

          {/* Format Selector */}
          {!lockTargetFormat && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Target Format</label>
              <div className={styles.formatGrid}>
                {OUTPUT_FORMATS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`${styles.formatButton} ${outputFormat === f.value ? styles.formatButtonActive : ""}`}
                    onClick={() => {
                      setOutputFormat(f.value);
                      if (f.value === "image/svg+xml") {
                        setCurrentMode("png-to-svg");
                      } else if (currentMode === "png-to-svg") {
                        setCurrentMode("standard");
                      }
                      setResult(null);
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality Slider (for JPG and WebP) */}
          {(outputFormat === "image/jpeg" || outputFormat === "image/webp") && (
            <div className={styles.controlGroup}>
              <div className={styles.sliderHeader}>
                <label className={styles.controlLabel}>Output Quality</label>
                <span className={styles.sliderValue}>{quality}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={quality}
                onChange={(e) => {
                  setQuality(Number(e.target.value));
                  setResult(null);
                }}
                className={styles.slider}
              />
              <span className={styles.helperText}>
                Higher quality results in larger file sizes. 85-90% is ideal for web.
              </span>
            </div>
          )}

          {outputFormat === "image/svg+xml" && (
            <div className={styles.infoBanner}>
              Vectorizes raster pixels into scalable SVG vector shapes that can be infinitely enlarged without pixelation.
            </div>
          )}

          {/* Actions */}
          <div className={styles.actionButtons}>
            {result ? (
              <>
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  onClick={handleDownload}
                >
                  <Download size={16} />
                  <span>Download {targetExt}</span>
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={handleReset}
                >
                  <RotateCcw size={15} />
                  <span>Adjust Options</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.buttonPrimary}
                onClick={handleConvert}
                disabled={processing}
              >
                <RefreshCw
                  size={16}
                  style={{ animation: processing ? "spin 1s linear infinite" : "none" }}
                />
                <span>{processing ? "Converting..." : `Convert to ${targetExt}`}</span>
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
