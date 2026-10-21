"use client";
import { useState, useRef, useCallback } from "react";
import { notify } from "@/lib/toast";

export function QrCodeGeneratorClient() {
  const [text, setText] = useState("https://techbd.com");
  const [size, setSize] = useState<number>(256);
  const [color, setColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  // Using a reliable public API for QR generation since local libs are unavailable
  const qrUrl = text.trim()
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${color.replace("#", "")}&bgcolor=${bgColor.replace("#", "")}&format=png`
    : "";

  const handleDownload = async () => {
    if (!qrUrl || !text.trim()) {
      const msg = "Please enter content to generate a QR code";
      setError(msg);
      notify.warning("Content required", { description: msg, id: "qr-toast" });
      return;
    }
    setError("");
    setStatusMsg("");
    try {
      setLoading(true);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-code-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      const msg = "QR code downloaded successfully";
      setStatusMsg(msg);
      notify.success("QR code downloaded", { description: msg, id: "qr-download-toast" });
      setTimeout(() => setStatusMsg(""), 3000);
    } catch {
      const msg = "Download failed. Please try again.";
      setError(msg);
      notify.error("Download failed", { description: msg, id: "qr-toast" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyImage = useCallback(async () => {
    if (!qrUrl || !text.trim()) {
      const msg = "Please enter content to generate a QR code";
      setError(msg);
      notify.warning("Content required", { description: msg, id: "qr-toast" });
      return;
    }
    setError("");
    setStatusMsg("");
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      const msg = "QR code copied to clipboard!";
      setStatusMsg(msg);
      notify.success("Copied to clipboard", { description: msg, id: "qr-copy-toast" });
      setTimeout(() => setStatusMsg(""), 3000);
    } catch {
      const msg = "Failed to copy image. Try downloading instead.";
      setError(msg);
      notify.error("Copy failed", { description: msg, id: "qr-toast" });
    }
  }, [qrUrl, text]);

  const handleClear = () => {
    setText("");
    setError("");
    setStatusMsg("");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(0, 0, 0, 0.3)",
    color: "#f8fafc",
    fontSize: "1rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--text-secondary, #94a3b8)",
    fontSize: "0.9rem",
    fontWeight: 600,
    marginBottom: "8px",
    display: "block",
  };

  const accentColor = "#7C3AED";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Input Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label htmlFor="qr-text" style={labelStyle}>
            Content (URL or Text)
          </label>
          <input
            id="qr-text"
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(""); }}
            placeholder="Enter URL or text..."
            aria-describedby={error ? "qr-error" : undefined}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = `${accentColor}80`)}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")}
          />
        </div>

        {/* Customization Options */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <label htmlFor="qr-size" style={labelStyle}>
              Size (px)
            </label>
            <select
              id="qr-size"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value={128}>128 x 128</option>
              <option value={256}>256 x 256</option>
              <option value={512}>512 x 512</option>
              <option value={1024}>1024 x 1024</option>
            </select>
          </div>
          <div>
            <label htmlFor="qr-color" style={labelStyle}>
              Foreground
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                id="qr-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: "48px",
                  height: "48px",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: "transparent",
                }}
              />
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{color}</span>
            </div>
          </div>
          <div>
            <label htmlFor="qr-bg" style={labelStyle}>
              Background
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                id="qr-bg"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{
                  width: "48px",
                  height: "48px",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: "transparent",
                }}
              />
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{bgColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      <div aria-live="polite" role="status">
        {error && (
          <p id="qr-error" role="alert" style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
        {statusMsg && !error && (
          <p style={{ color: "#22c55e", margin: 0, fontSize: "0.9rem" }}>
            {statusMsg}
          </p>
        )}
      </div>

      {/* Preview Area */}
      <div
        aria-live="polite"
        aria-label={qrUrl ? "QR code preview generated" : "No QR code preview"}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "32px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px dashed rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          minHeight: "300px",
        }}
      >
        {qrUrl ? (
          <img
            ref={imgRef}
            src={qrUrl}
            alt={`QR code for: ${text}`}
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "8px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <span style={{ color: "var(--text-muted)" }}>Enter content to generate QR</span>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleDownload}
          disabled={!text.trim() || loading}
          aria-label="Download QR code as PNG"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "none",
            background: accentColor,
            color: "#fff",
            cursor: text.trim() && !loading ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: text.trim() && !loading ? 1 : 0.5,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          {loading ? "Downloading..." : "Download PNG"}
        </button>
        <button
          onClick={handleCopyImage}
          disabled={!text.trim()}
          aria-label="Copy QR code image to clipboard"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#f8fafc",
            cursor: text.trim() ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: text.trim() ? 1 : 0.5,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          Copy Image
        </button>
        <button
          onClick={handleClear}
          disabled={!text}
          aria-label="Clear QR code content"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#f8fafc",
            cursor: text ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: text ? 1 : 0.5,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}