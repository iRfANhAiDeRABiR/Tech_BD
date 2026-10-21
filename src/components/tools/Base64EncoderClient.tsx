"use client";
import { useState } from "react";
import { notify } from "@/lib/toast";

export function Base64EncoderClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleProcess = () => {
    setError("");
    setCopied(false);
    if (!input) {
      setOutput("");
      return;
    }

    try {
      if (mode === "encode") {
        // Encode UTF-8 string to Base64
        const bytes = new TextEncoder().encode(input);
        const binary = String.fromCharCode(...bytes);
        setOutput(btoa(binary));
      } else {
        // Decode Base64 to UTF-8 string
        const binary = atob(input);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        setOutput(new TextDecoder().decode(bytes));
      }
    } catch {
      const msg = mode === "decode" ? "Invalid Base64 string" : "Failed to encode text";
      setError(msg);
      notify.error(mode === "decode" ? "Decoding failed" : "Encoding failed", {
        description: msg,
        id: "base64-error",
      });
      setOutput("");
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      notify.success("Copied to clipboard", {
        description: "Base64 result copied to clipboard.",
        id: "base64-copy",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Failed to copy", {
        description: "Could not copy to clipboard.",
        id: "base64-copy-error",
      });
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
    setCopied(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(0, 0, 0, 0.3)",
    color: "#f8fafc",
    fontSize: "1rem",
    fontFamily: "'Courier New', monospace",
    resize: "vertical",
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

  const accentColor = "#EC4899";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Mode Selection */}
      <div style={{ display: "flex", gap: "12px" }} role="group" aria-label="Conversion mode">
        {(["encode", "decode"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
              setOutput("");
            }}
            aria-pressed={mode === m}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: "12px",
              border: `1px solid ${mode === m ? accentColor : "rgba(255, 255, 255, 0.1)"}`,
              background: mode === m ? `${accentColor}26` : "rgba(255, 255, 255, 0.03)",
              color: mode === m ? accentColor : "var(--text-secondary, #94a3b8)",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.2s ease",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label htmlFor="b64-input" style={labelStyle}>
          Input Text
        </label>
        <textarea
          id="b64-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 string to decode..."}
          rows={4}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = `${accentColor}80`)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")}
        />
      </div>

      {/* Error Message */}
      <div aria-live="polite" role="status">
        {error && (
          <p role="alert" style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem" }}>{error}</p>
        )}
      </div>

      {/* Output Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label htmlFor="b64-output" style={{ ...labelStyle, marginBottom: 0 }}>
            Result
          </label>
          {output && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)" }}>
              {output.length} chars
            </span>
          )}
        </div>
        <textarea
          id="b64-output"
          readOnly
          value={output}
          aria-live="polite"
          placeholder={`${mode === "encode" ? "Encoded" : "Decoded"} result will appear here...`}
          rows={4}
          style={{
            ...inputStyle,
            background: "rgba(255, 255, 255, 0.03)",
            cursor: "default",
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleProcess}
          disabled={!input}
          aria-label={mode === "encode" ? "Encode input text" : "Decode input text"}
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "none",
            background: accentColor,
            color: "#fff",
            cursor: input ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: input ? 1 : 0.5,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          {mode === "encode" ? "Encode" : "Decode"}
        </button>
        <button
          onClick={handleCopy}
          disabled={!output}
          aria-label="Copy result to clipboard"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: `1px solid ${copied ? "#22c55e" : "rgba(255, 255, 255, 0.1)"}`,
            background: copied ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.06)",
            color: copied ? "#22c55e" : "#f8fafc",
            cursor: output ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: output ? 1 : 0.5,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          {copied ? "Copied!" : "Copy Result"}
        </button>
        <button
          onClick={handleClear}
          disabled={!input && !output}
          aria-label="Clear input and output"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#f8fafc",
            cursor: !input && !output ? "not-allowed" : "pointer",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: !input && !output ? 0.5 : 1,
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