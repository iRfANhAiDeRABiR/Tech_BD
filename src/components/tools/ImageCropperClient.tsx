"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Crop, Download, RefreshCw, RotateCw, Check, ArrowLeft, Sparkles } from "lucide-react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import {
  cropImage,
  downloadBlob,
  formatBytes,
  getExtensionFromMime,
  type ImageFormat,
} from "@/lib/imageProcessing";
import styles from "./ImageCropper.module.css";

interface AspectOption {
  label: string;
  ratio: number | null; // width / height, or null for freeform
}

const ASPECT_RATIOS: AspectOption[] = [
  { label: "Freeform", ratio: null },
  { label: "1:1 Square", ratio: 1 },
  { label: "16:9 Wide", ratio: 16 / 9 },
  { label: "4:3 Classic", ratio: 4 / 3 },
  { label: "9:16 Story", ratio: 9 / 16 },
  { label: "3:2 Photo", ratio: 3 / 2 },
];

export interface CropPreset {
  id: string;
  name: string;
  shortLabel: string;
  fromDesc: string;
  targetFormat: ImageFormat;
  accept?: string;
  badge?: string;
  hint: string;
}

export const CROP_PRESETS: CropPreset[] = [
  {
    id: "auto",
    name: "Any Format",
    shortLabel: "Any Image",
    fromDesc: "Any Image",
    targetFormat: "image/png",
    hint: "Crop and trim any image with precision handles and custom aspect ratios.",
  },
  {
    id: "crop-png",
    name: "Crop PNG",
    shortLabel: "PNG (Alpha)",
    fromDesc: "PNG Image",
    targetFormat: "image/png",
    accept: "image/png,.png",
    badge: "Transparent",
    hint: "Crop PNG images while preserving full transparent alpha channels.",
  },
  {
    id: "crop-jpg",
    name: "Crop JPG",
    shortLabel: "JPG Photo",
    fromDesc: "JPG Photo",
    targetFormat: "image/jpeg",
    accept: "image/jpeg,.jpg,.jpeg",
    badge: "High Quality",
    hint: "Crop JPG photos with precision aspect ratios, quality, and file size controls.",
  },
  {
    id: "crop-webp",
    name: "Crop WebP",
    shortLabel: "WebP",
    fromDesc: "WebP Image",
    targetFormat: "image/webp",
    accept: "image/webp,.webp",
    badge: "Modern",
    hint: "Crop modern WebP images with high compression export.",
  },
];

export interface ImageCropperClientProps {
  initialPreset?: string;
  defaultFormat?: ImageFormat;
  lockFormat?: boolean;
  toolTitle?: string;
  toolSubtitle?: string;
  allowedAccept?: string;
}

export function ImageCropperClient({
  initialPreset,
  defaultFormat = "image/png",
  lockFormat = false,
  toolTitle = "Crop Image",
  toolSubtitle = "Crop and trim your photos with precise dimensions and aspect ratios.",
  allowedAccept,
}: ImageCropperClientProps) {
  // Determine starting preset
  const getStartingPreset = (): CropPreset => {
    if (initialPreset) {
      const match = CROP_PRESETS.find((p) => p.id === initialPreset);
      if (match) return match;
    }
    if (defaultFormat === "image/jpeg") {
      return CROP_PRESETS.find((p) => p.id === "crop-jpg")!;
    }
    if (defaultFormat === "image/webp") {
      return CROP_PRESETS.find((p) => p.id === "crop-webp")!;
    }
    return CROP_PRESETS[0];
  };

  const [activePreset, setActivePreset] = useState<CropPreset>(getStartingPreset);
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>(activePreset.targetFormat || defaultFormat);
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [quality, setQuality] = useState<number>(90);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);

  // Viewport display coordinates for the crop box
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 20,
    y: 20,
    w: 240,
    h: 240,
  });

  const [stageDims, setStageDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Sync client-side URL params if present (e.g. ?preset=crop-png)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get("preset");
    if (presetParam) {
      const match = CROP_PRESETS.find((p) => p.id === presetParam);
      if (match) {
        setActivePreset(match);
        setOutputFormat(match.targetFormat);
      }
    }
  }, []);

  const handleSelectPreset = useCallback((preset: CropPreset) => {
    setActivePreset(preset);
    setOutputFormat(preset.targetFormat);
    setResult(null);
  }, []);

  // Init crop box to 80% centered when image is loaded
  const initCropBox = useCallback((imgW: number, imgH: number, ratio: number | null) => {
    let w = Math.round(imgW * 0.8);
    let h = Math.round(imgH * 0.8);

    if (ratio !== null) {
      if (w / h > ratio) {
        w = Math.round(h * ratio);
      } else {
        h = Math.round(w / ratio);
      }
    }

    const x = Math.max(0, Math.round((imgW - w) / 2));
    const y = Math.max(0, Math.round((imgH - h) / 2));
    setBox({ x, y, w, h });
  }, []);

  const handleImageLoaded = useCallback(() => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    setStageDims({ w: rect.width, h: rect.height });
    initCropBox(rect.width, rect.height, selectedRatio);
  }, [initCropBox, selectedRatio]);

  const handleImageSelect = useCallback(
    (data: ImageFileData) => {
      setImageData(data);
      setResult(null);
      setRotation(0);
      if (activePreset.id !== "auto") {
        setOutputFormat(activePreset.targetFormat);
      } else if (data.format === "PNG") {
        setOutputFormat("image/png");
      } else {
        setOutputFormat("image/jpeg");
      }
    },
    [activePreset]
  );

  const handleClear = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setImageData(null);
    setResult(null);
    setStageDims({ w: 0, h: 0 });
    setRotation(0);
  }, [result]);

  const handleRatioChange = (ratio: number | null) => {
    setSelectedRatio(ratio);
    if (stageDims.w > 0 && stageDims.h > 0) {
      initCropBox(stageDims.w, stageDims.h, ratio);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Dragging & Resizing State
  const dragRef = useRef<{
    isDragging: boolean;
    mode: "move" | "tl" | "tr" | "bl" | "br" | "tc" | "bc" | "ml" | "mr";
    startX: number;
    startY: number;
    startBox: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const handleMouseDown = (
    e: React.MouseEvent,
    mode: "move" | "tl" | "tr" | "bl" | "br" | "tc" | "bc" | "ml" | "mr"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      isDragging: true,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...box },
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !stageDims.w || !stageDims.h) return;
      const { mode, startX, startY, startBox } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newX = startBox.x;
      let newY = startBox.y;
      let newW = startBox.w;
      let newH = startBox.h;

      const minSize = 30;

      if (mode === "move") {
        newX = Math.max(0, Math.min(stageDims.w - newW, startBox.x + dx));
        newY = Math.max(0, Math.min(stageDims.h - newH, startBox.y + dy));
      } else if (mode === "br") {
        newW = Math.max(minSize, Math.min(stageDims.w - startBox.x, startBox.w + dx));
        newH = selectedRatio !== null ? newW / selectedRatio : Math.max(minSize, Math.min(stageDims.h - startBox.y, startBox.h + dy));
      } else if (mode === "bl") {
        const potentialW = Math.max(minSize, startBox.w - dx);
        const maxAllowedW = startBox.x + startBox.w;
        newW = Math.min(potentialW, maxAllowedW);
        newX = startBox.x + (startBox.w - newW);
        newH = selectedRatio !== null ? newW / selectedRatio : Math.max(minSize, Math.min(stageDims.h - startBox.y, startBox.h + dy));
      } else if (mode === "tr") {
        newW = Math.max(minSize, Math.min(stageDims.w - startBox.x, startBox.w + dx));
        const potentialH = Math.max(minSize, startBox.h - dy);
        newH = selectedRatio !== null ? newW / selectedRatio : Math.min(potentialH, startBox.y + startBox.h);
        newY = startBox.y + (startBox.h - newH);
      } else if (mode === "tl") {
        const potentialW = Math.max(minSize, startBox.w - dx);
        newW = Math.min(potentialW, startBox.x + startBox.w);
        newX = startBox.x + (startBox.w - newW);
        const potentialH = selectedRatio !== null ? newW / selectedRatio : Math.max(minSize, startBox.h - dy);
        newH = Math.min(potentialH, startBox.y + startBox.h);
        newY = startBox.y + (startBox.h - newH);
      } else if (mode === "tc" && selectedRatio === null) {
        newH = Math.max(minSize, Math.min(startBox.y + startBox.h, startBox.h - dy));
        newY = startBox.y + (startBox.h - newH);
      } else if (mode === "bc" && selectedRatio === null) {
        newH = Math.max(minSize, Math.min(stageDims.h - startBox.y, startBox.h + dy));
      } else if (mode === "ml" && selectedRatio === null) {
        newW = Math.max(minSize, Math.min(startBox.x + startBox.w, startBox.w - dx));
        newX = startBox.x + (startBox.w - newW);
      } else if (mode === "mr" && selectedRatio === null) {
        newW = Math.max(minSize, Math.min(stageDims.w - startBox.x, startBox.w + dx));
      }

      // Constrain within stage bounds
      if (newX + newW > stageDims.w) newW = stageDims.w - newX;
      if (newY + newH > stageDims.h) newH = stageDims.h - newY;

      setBox({
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        w: Math.max(minSize, newW),
        h: Math.max(minSize, newH),
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [stageDims, selectedRatio, box]);

  // Execute Crop
  const handleExecuteCrop = async () => {
    if (!imageData || !imgRef.current) return;
    setProcessing(true);

    try {
      // Calculate real image scale
      const naturalW = imageData.width;
      const naturalH = imageData.height;
      const displayW = stageDims.w || 1;
      const displayH = stageDims.h || 1;

      const scaleX = naturalW / displayW;
      const scaleY = naturalH / displayH;

      const realRect = {
        x: Math.round(box.x * scaleX),
        y: Math.round(box.y * scaleY),
        width: Math.round(box.w * scaleX),
        height: Math.round(box.h * scaleY),
      };

      const croppedBlob = await cropImage(imageData.url, {
        rect: realRect,
        format: outputFormat,
        quality: quality / 100,
        rotation,
        backgroundColor: outputFormat === "image/jpeg" ? "#ffffff" : undefined,
      });

      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob: croppedBlob,
        url: URL.createObjectURL(croppedBlob),
      });

      notify.success("Image cropped successfully", {
        description: `Crop ready for download (${formatBytes(croppedBlob.size)}).`,
        id: "crop-toast",
      });
    } catch (err) {
      console.error("Crop error:", err);
      notify.error("Cropping failed", {
        description: "Could not crop image. Please adjust and try again.",
        id: "crop-toast",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !imageData) return;
    const ext = getExtensionFromMime(outputFormat);
    const baseName = imageData.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(result.blob, `${baseName}-cropped.${ext}`);
    notify.info("Download started", {
      description: `${baseName}-cropped.${ext} is downloading.`,
      id: "crop-toast",
    });
  };

  const handleAdjustAgain = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  };

  // Dimensions of output crop in natural pixels
  const naturalScaleX = imageData ? imageData.width / (stageDims.w || 1) : 1;
  const naturalScaleY = imageData ? imageData.height / (stageDims.h || 1) : 1;
  const pixelW = Math.round(box.w * naturalScaleX);
  const pixelH = Math.round(box.h * naturalScaleY);

  // Presets Bar Component
  const renderPresetsBar = () => (
    <div className={styles.formatPresetBar}>
      <div className={styles.formatPresetHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={15} style={{ color: "#6366f1" }} />
          <h4 className={styles.formatPresetTitle}>Crop Formats</h4>
        </div>
        <p className={styles.presetHint}>{activePreset.hint}</p>
      </div>
      <div className={styles.formatPresetGrid}>
        {CROP_PRESETS.map((preset) => {
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
        ? "Upload Image to Crop"
        : `Upload ${activePreset.fromDesc} to Crop`;

    const uploadAccept = activePreset.accept || allowedAccept;

    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{toolTitle}</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #94a3b8)", margin: "6px 0 0" }}>
            {toolSubtitle}
          </p>
        </div>

        {/* Format Selector Pills Bar */}
        {renderPresetsBar()}

        <ImageUploader
          onImageSelect={handleImageSelect}
          onClear={handleClear}
          accept={uploadAccept}
          label={uploadLabel}
        />
        <p className={styles.privacyNote}>
          Your images are cropped and processed 100% locally in your browser. Complete privacy.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Format Selector Pills Bar */}
      {renderPresetsBar()}

      <div className={styles.editorGrid}>
        {/* Left Viewport Stage */}
        <div className={styles.stageCard}>
          {result ? (
            <div className={styles.resultArea}>
              <img src={result.url} alt="Cropped Preview" className={styles.resultImage} />
              <div className={styles.resultBar}>
                <span>Crop Result: {pixelW} × {pixelH} px ({formatBytes(result.blob.size)})</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className={styles.toolBtn} onClick={handleDownload}>
                    <Download size={14} />
                    <span>Download Crop</span>
                  </button>
                  <button type="button" className={styles.toolBtn} onClick={handleAdjustAgain}>
                    <RefreshCw size={14} />
                    <span>Adjust Crop</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.canvasArea} ref={stageRef}>
              <img
                ref={imgRef}
                src={imageData.url}
                alt="Source to Crop"
                className={styles.stageImage}
                onLoad={handleImageLoaded}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease",
                }}
              />

              {/* Crop Box with handles */}
              {stageDims.w > 0 && (
                <div
                  className={styles.cropBox}
                  style={{
                    left: `${box.x}px`,
                    top: `${box.y}px`,
                    width: `${box.w}px`,
                    height: `${box.h}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, "move")}
                >
                  <div className={styles.cropGridLineH1} />
                  <div className={styles.cropGridLineH2} />
                  <div className={styles.cropGridLineV1} />
                  <div className={styles.cropGridLineV2} />

                  {/* 8 Resize Handles */}
                  <div className={`${styles.handle} ${styles.handleTL}`} onMouseDown={(e) => handleMouseDown(e, "tl")} />
                  <div className={`${styles.handle} ${styles.handleTR}`} onMouseDown={(e) => handleMouseDown(e, "tr")} />
                  <div className={`${styles.handle} ${styles.handleBL}`} onMouseDown={(e) => handleMouseDown(e, "bl")} />
                  <div className={`${styles.handle} ${styles.handleBR}`} onMouseDown={(e) => handleMouseDown(e, "br")} />
                  {selectedRatio === null && (
                    <>
                      <div className={`${styles.handle} ${styles.handleTC}`} onMouseDown={(e) => handleMouseDown(e, "tc")} />
                      <div className={`${styles.handle} ${styles.handleBC}`} onMouseDown={(e) => handleMouseDown(e, "bc")} />
                      <div className={`${styles.handle} ${styles.handleML}`} onMouseDown={(e) => handleMouseDown(e, "ml")} />
                      <div className={`${styles.handle} ${styles.handleMR}`} onMouseDown={(e) => handleMouseDown(e, "mr")} />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls Panel */}
        <div className={styles.controlsPanel}>
          <div>
            <h2 className={styles.panelTitle}>{toolTitle}</h2>
            <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", margin: "4px 0 0" }}>
              {toolSubtitle}
            </p>
          </div>

          {/* Aspect Ratio Presets */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Aspect Ratio</label>
            <div className={styles.ratioGrid}>
              {ASPECT_RATIOS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`${styles.ratioBtn} ${selectedRatio === item.ratio ? styles.ratioBtnActive : ""}`}
                  onClick={() => handleRatioChange(item.ratio)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension Details */}
          <div className={styles.dimensionBadge}>
            <span>Output Resolution:</span>
            <span>{pixelW} × {pixelH} px</span>
          </div>

          {/* Rotation Control */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Orientation</label>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={handleRotate}
            >
              <RotateCw size={15} />
              <span>Rotate 90° ({rotation}°)</span>
            </button>
          </div>

          {/* Output Format */}
          {!lockFormat && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Output Format</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as ImageFormat)}
                className={styles.selectInput}
              >
                <option value="image/png">PNG (Preserve Transparency)</option>
                <option value="image/jpeg">JPG / JPEG (Small File Size)</option>
                <option value="image/webp">WebP (Modern Web Standard)</option>
              </select>
            </div>
          )}

          {/* JPEG Quality Slider */}
          {outputFormat === "image/jpeg" && (
            <div className={styles.fieldGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className={styles.label}>JPEG Quality</label>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1" }}>{quality}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
              />
            </div>
          )}

          {/* Crop Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleExecuteCrop}
              disabled={processing}
            >
              <Crop size={16} />
              <span>{processing ? "Cropping..." : "Crop & Save Image"}</span>
            </button>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleClear}
            >
              Choose Another Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
