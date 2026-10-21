"use client";
import { useState, useCallback } from "react";
import { ImageUploader, type ImageFileData } from "./ImageUploader";
import { notify } from "@/lib/toast";
import {
  generateMeme,
  downloadBlob,
  formatBytes,
} from "@/lib/imageProcessing";
import styles from "./ImageTool.module.css";

export function MemeGeneratorClient() {
  const [imageData, setImageData] = useState<ImageFileData | null>(null);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [fontSize, setFontSize] = useState(0); // 0 = auto
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [strokeColor, setStrokeColor] = useState("#000000");
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

  const handleGenerate = useCallback(async () => {
    if (!imageData || (!topText.trim() && !bottomText.trim())) return;
    setProcessing(true);
    try {
      const blob = await generateMeme(imageData.url, {
        topText: topText.trim(),
        bottomText: bottomText.trim(),
        fontSize: fontSize || undefined,
        textColor,
        strokeColor,
      });
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
      });
      notify.success("Meme generated", {
        description: `Your meme is ready (${formatBytes(blob.size)}).`,
        id: "meme-toast",
      });
    } catch {
      notify.error("Generation failed", {
        description: "Could not generate meme. Please try again.",
        id: "meme-toast",
      });
    } finally {
      setProcessing(false);
    }
  }, [imageData, topText, bottomText, fontSize, textColor, strokeColor, result]);

  const handleDownload = useCallback(() => {
    if (!result || !imageData) return;
    const baseName = imageData.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(result.blob, `${baseName}-meme.png`);
    notify.info("Download started", {
      description: `${baseName}-meme.png is downloading.`,
      id: "meme-download-toast",
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
              <img src={result.url} alt="Meme preview" className={styles.previewImage} />
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
          <h3 className={styles.sectionTitle}>Meme Text</h3>

          {/* Top Text Input */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="meme-top">
              Top Text
            </label>
            <input
              id="meme-top"
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="Enter top text"
              className={styles.textInput}
              maxLength={100}
            />
          </div>

          {/* Bottom Text Input */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="meme-bottom">
              Bottom Text
            </label>
            <input
              id="meme-bottom"
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="Enter bottom text"
              className={styles.textInput}
              maxLength={100}
            />
          </div>

          {/* Font Size Slider */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="meme-size">
              Font Size: {fontSize === 0 ? "Auto" : `${fontSize}px`}
            </label>
            <input
              id="meme-size"
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
                    border: textColor === c.value ? "2px solid var(--accent-color, #F97316)" : "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Color */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Outline Color</label>
            <div className={styles.presetGrid}>
              {[
                { label: "Black", value: "#000000" },
                { label: "White", value: "#FFFFFF" },
                { label: "None", value: "transparent" },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.presetButton} ${strokeColor === c.value ? styles.lockButtonActive : ""}`}
                  onClick={() => setStrokeColor(c.value)}
                  style={{
                    backgroundColor: c.value === "transparent" ? "var(--bg-secondary, #1e293b)" : c.value,
                    color: c.value === "#FFFFFF" ? "#000" : "#FFF",
                    border: strokeColor === c.value ? "2px solid var(--accent-color, #F97316)" : "1px solid rgba(255,255,255,0.2)",
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
              disabled={processing || (!topText.trim() && !bottomText.trim())}
            >
              {processing ? "Generating Meme..." : "Generate Meme"}
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