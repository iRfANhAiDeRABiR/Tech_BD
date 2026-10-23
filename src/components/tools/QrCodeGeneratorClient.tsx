"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import {
  Download,
  Copy,
  Link as LinkIcon,
  FileText,
  Wifi,
  Mail,
  Phone,
  MessageCircle,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { notify } from "@/lib/toast";
import styles from "./QrCodeGenerator.module.css";

type PresetType = "url" | "text" | "wifi" | "whatsapp" | "email" | "phone";

export function QrCodeGeneratorClient() {
  const [preset, setPreset] = useState<PresetType>("url");

  // Fields
  const [urlVal, setUrlVal] = useState("https://techbd.com");
  const [textVal, setTextVal] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiType, setWifiType] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [waPhone, setWaPhone] = useState("");
  const [waMsg, setWaMsg] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubj, setEmailSubj] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [phoneVal, setPhoneVal] = useState("");

  // Styling
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [isTransparent, setIsTransparent] = useState(false);
  const [size, setSize] = useState<number>(512);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");

  // Output
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrSvg, setQrSvg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Compute final encoded payload
  const getEncodedPayload = useCallback((): string => {
    switch (preset) {
      case "url":
        return urlVal.trim();
      case "text":
        return textVal.trim();
      case "wifi":
        if (!wifiSsid.trim()) return "";
        return `WIFI:S:${wifiSsid.trim()};T:${wifiType};P:${wifiPass};;`;
      case "whatsapp": {
        const cleanPhone = waPhone.replace(/\D/g, "");
        if (!cleanPhone) return "";
        return `https://wa.me/${cleanPhone}${waMsg ? `?text=${encodeURIComponent(waMsg)}` : ""}`;
      }
      case "email":
        if (!emailTo.trim()) return "";
        return `mailto:${emailTo.trim()}?subject=${encodeURIComponent(emailSubj)}&body=${encodeURIComponent(emailBody)}`;
      case "phone":
        if (!phoneVal.trim()) return "";
        return `tel:${phoneVal.trim()}`;
      default:
        return "";
    }
  }, [preset, urlVal, textVal, wifiSsid, wifiPass, wifiType, waPhone, waMsg, emailTo, emailSubj, emailBody, phoneVal]);

  // Generate QR Code locally in browser
  useEffect(() => {
    const payload = getEncodedPayload();
    if (!payload) {
      setQrDataUrl("");
      setQrSvg("");
      return;
    }

    const actualBg = isTransparent ? "#00000000" : bgColor;

    // Generate PNG Data URL
    QRCode.toDataURL(payload, {
      width: size,
      margin: 2,
      errorCorrectionLevel: errorLevel,
      color: {
        dark: fgColor,
        light: actualBg,
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR PNG generation error:", err));

    // Generate SVG string
    QRCode.toString(payload, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: errorLevel,
      color: {
        dark: fgColor,
        light: actualBg,
      },
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error("QR SVG generation error:", err));
  }, [getEncodedPayload, fgColor, bgColor, isTransparent, size, errorLevel]);

  // Download PNG
  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-${preset}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify.success("QR Code Downloaded", {
      description: "High-resolution PNG file saved to your device.",
      id: "qr-toast",
    });
  };

  // Download SVG
  const handleDownloadSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${preset}-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Vector SVG Downloaded", {
      description: "Scalable vector SVG file saved for printing and design.",
      id: "qr-toast",
    });
  };

  // Copy Image to Clipboard
  const handleCopyClipboard = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      notify.success("Copied to clipboard!", { id: "qr-toast" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Could not copy directly. Please download the PNG instead.", { id: "qr-toast" });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* Left Form Settings */}
        <div className={styles.formCard}>
          {/* Preset Tabs */}
          <div className={styles.presetTabs}>
            <button
              type="button"
              className={`${styles.presetTab} ${preset === "url" ? styles.presetTabActive : ""}`}
              onClick={() => setPreset("url")}
            >
              <LinkIcon size={14} />
              <span>Website URL</span>
            </button>
            <button
              type="button"
              className={`${styles.presetTab} ${preset === "text" ? styles.presetTabActive : ""}`}
              onClick={() => setPreset("text")}
            >
              <FileText size={14} />
              <span>Plain Text</span>
            </button>
            <button
              type="button"
              className={`${styles.presetTab} ${preset === "wifi" ? styles.presetTabActive : ""}`}
              onClick={() => setPreset("wifi")}
            >
              <Wifi size={14} />
              <span>Wi-Fi Network</span>
            </button>
            <button
              type="button"
              className={`${styles.presetTab} ${preset === "whatsapp" ? styles.presetTabActive : ""}`}
              onClick={() => setPreset("whatsapp")}
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              className={`${styles.presetTab} ${preset === "email" ? styles.presetTabActive : ""}`}
              onClick={() => setPreset("email")}
            >
              <Mail size={14} />
              <span>Email</span>
            </button>
            <button
              type="button"
              className={`${styles.presetTab} ${preset === "phone" ? styles.presetTabActive : ""}`}
              onClick={() => setPreset("phone")}
            >
              <Phone size={14} />
              <span>Phone Call</span>
            </button>
          </div>

          {/* Preset Specific Inputs */}
          {preset === "url" && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Destination Website URL</label>
              <input
                type="url"
                value={urlVal}
                onChange={(e) => setUrlVal(e.target.value)}
                placeholder="https://example.com"
                className={styles.input}
              />
            </div>
          )}

          {preset === "text" && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Text Content / Note</label>
              <textarea
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                placeholder="Type or paste any text or note here..."
                className={styles.textarea}
              />
            </div>
          )}

          {preset === "wifi" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Network Name (SSID)</label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="e.g. Office_Guest_WiFi"
                  className={styles.input}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Password</label>
                <input
                  type="text"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  placeholder="Wi-Fi Password (leave blank if open)"
                  className={styles.input}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Encryption</label>
                <select
                  value={wifiType}
                  onChange={(e) => setWifiType(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                  <option value="WEP">WEP (Legacy)</option>
                  <option value="nopass">None (Open Network)</option>
                </select>
              </div>
            </div>
          )}

          {preset === "whatsapp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>WhatsApp Phone Number (with Country Code)</label>
                <input
                  type="tel"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="e.g. +8801712345678"
                  className={styles.input}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Pre-filled Message (Optional)</label>
                <input
                  type="text"
                  value={waMsg}
                  onChange={(e) => setWaMsg(e.target.value)}
                  placeholder="e.g. Hello, I am inquiring about..."
                  className={styles.input}
                />
              </div>
            </div>
          )}

          {preset === "email" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Recipient Email</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="support@techbd.com"
                  className={styles.input}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Subject</label>
                <input
                  type="text"
                  value={emailSubj}
                  onChange={(e) => setEmailSubj(e.target.value)}
                  placeholder="Inquiry from Tech BD"
                  className={styles.input}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Message Body</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your email draft..."
                  className={styles.textarea}
                />
              </div>
            </div>
          )}

          {preset === "phone" && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Phone Number to Dial</label>
              <input
                type="tel"
                value={phoneVal}
                onChange={(e) => setPhoneVal(e.target.value)}
                placeholder="+8801..."
                className={styles.input}
              />
            </div>
          )}

          {/* Color & Size Customization Grid */}
          <div className={styles.customizerGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Foreground Color</label>
              <div className={styles.colorPickerBox}>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className={styles.colorInput}
                />
                <span className={styles.colorHex}>{fgColor}</span>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Background Color</label>
              <div className={styles.colorPickerBox}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    setIsTransparent(false);
                  }}
                  disabled={isTransparent}
                  className={styles.colorInput}
                />
                <span className={styles.colorHex}>
                  {isTransparent ? "Transparent" : bgColor}
                </span>
              </div>
            </div>
          </div>

          {/* Transparent Background Checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              id="qr-trans"
              checked={isTransparent}
              onChange={(e) => setIsTransparent(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#6366f1", cursor: "pointer" }}
            />
            <label htmlFor="qr-trans" style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
              Transparent Background (Ideal for overlays & branding)
            </label>
          </div>

          {/* Size & Quality */}
          <div className={styles.customizerGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Export Resolution</label>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className={styles.select}
              >
                <option value={256}>256 × 256 px (Standard)</option>
                <option value={512}>512 × 512 px (High Definition)</option>
                <option value={1024}>1024 × 1024 px (Ultra HD / Print)</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Error Correction</label>
              <select
                value={errorLevel}
                onChange={(e) => setErrorLevel(e.target.value as any)}
                className={styles.select}
              >
                <option value="L">Level L (7% recovery)</option>
                <option value="M">Level M (15% standard)</option>
                <option value="Q">Level Q (25% high)</option>
                <option value="H">Level H (30% best for logo)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Preview Card */}
        <div className={styles.previewCard}>
          <h3 className={styles.previewTitle}>Live QR Code Preview</h3>

          <div
            className={styles.qrCanvasWrap}
            style={{
              background: isTransparent
                ? "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px"
                : bgColor,
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Generated QR Code"
                className={styles.qrImage}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Enter details to generate QR code
              </div>
            )}
          </div>

          <div className={styles.actionStack}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleDownloadPng}
              disabled={!qrDataUrl}
            >
              <Download size={16} />
              <span>Download PNG ({size}px)</span>
            </button>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleDownloadSvg}
              disabled={!qrSvg}
            >
              <Sparkles size={15} />
              <span>Download Vector SVG</span>
            </button>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleCopyClipboard}
              disabled={!qrDataUrl}
            >
              {copied ? <Check size={15} style={{ color: "#10b981" }} /> : <Copy size={15} />}
              <span>{copied ? "Copied!" : "Copy Image"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
