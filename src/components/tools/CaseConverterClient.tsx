"use client";

import { useState } from "react";
import { notify } from "@/lib/toast";

type CaseType = "upper" | "lower" | "title" | "sentence" | "alt" | "inverse";

const CASE_OPTIONS: { value: CaseType; label: string }[] = [
  { value: "upper", label: "UPPERCASE" },
  { value: "lower", label: "lowercase" },
  { value: "title", label: "Title Case" },
  { value: "sentence", label: "Sentence case" },
  { value: "alt", label: "aLtErNaTiNg" },
  { value: "inverse", label: "iNVERSE cASE" },
];

function convertText(text: string, type: CaseType): string {
  if (!text) return "";
  switch (type) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    case "alt":
      return text
        .split("")
        .map((char, i) =>
          i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
        )
        .join("");
    case "inverse":
      return text
        .split("")
        .map((char) =>
          char === char.toUpperCase()
            ? char.toLowerCase()
            : char.toUpperCase()
        )
        .join("");
    default:
      return text;
  }
}

export function CaseConverterClient() {
  const [input, setInput] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseType>("upper");
  const [copied, setCopied] = useState(false);

  const output = convertText(input, selectedCase);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      notify.success("Copied to clipboard", {
        description: "Converted text copied to clipboard.",
        id: "case-copy",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Failed to copy", {
        description: "Could not copy text to clipboard.",
        id: "case-copy-error",
      });
    }
  };

  const handleClear = () => {
    setInput("");
    setCopied(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Input Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label
          htmlFor="case-input"
          style={{
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Input Text
        </label>
        <textarea
          id="case-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste your text here..."
          rows={4}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(0, 0, 0, 0.3)",
            color: "#f8fafc",
            fontSize: "1rem",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "rgba(14, 165, 233, 0.5)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")
          }
        />
      </div>

      {/* Conversion Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span
          style={{
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Convert To
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "10px",
          }}
        >
          {CASE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedCase(opt.value)}
              aria-pressed={selectedCase === opt.value}
              style={{
                padding: "10px 12px",
                borderRadius: "12px",
                border: `1px solid ${
                  selectedCase === opt.value
                    ? "#0EA5E9"
                    : "rgba(255, 255, 255, 0.1)"
                }`,
                background:
                  selectedCase === opt.value
                    ? "rgba(14, 165, 233, 0.15)"
                    : "rgba(255, 255, 255, 0.03)",
                color:
                  selectedCase === opt.value
                    ? "#0EA5E9"
                    : "var(--text-secondary, #94a3b8)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <label
            htmlFor="case-output"
            style={{
              color: "var(--text-secondary, #94a3b8)",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            Result
          </label>
          {input && (
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted, #64748b)",
              }}
            >
              {output.length} chars
            </span>
          )}
        </div>
        <textarea
          id="case-output"
          readOnly
          value={output}
          aria-live="polite"
          placeholder="Converted text will appear here..."
          rows={4}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.03)",
            color: "#f8fafc",
            fontSize: "1rem",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            cursor: "default",
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleCopy}
          disabled={!output}
          aria-label="Copy converted text to clipboard"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "none",
            background: copied ? "#0EA5E9" : "#0EA5E9",
            color: "#fff",
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
          disabled={!input}
          aria-label="Clear input and output text"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#f8fafc",
            cursor: input ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: input ? 1 : 0.5,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          Clear Text
        </button>
      </div>
    </div>
  );
}