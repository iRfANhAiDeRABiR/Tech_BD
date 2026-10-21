"use client";

import { useState, useCallback, useEffect } from "react";
import { notify } from "@/lib/toast";

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

export function PasswordGeneratorClient() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const generatePassword = useCallback(() => {
    setError("");
    let charset = "";
    if (options.uppercase) charset += CHAR_SETS.uppercase;
    if (options.lowercase) charset += CHAR_SETS.lowercase;
    if (options.numbers) charset += CHAR_SETS.numbers;
    if (options.symbols) charset += CHAR_SETS.symbols;

    if (charset.length === 0) {
      setError("Select at least one character type");
      setPassword("");
      return;
    }

    const array = new Uint32Array(options.length);
    crypto.getRandomValues(array);
    let result = "";
    for (let i = 0; i < options.length; i++) {
      result += charset[array[i] % charset.length];
    }
    setPassword(result);
    setCopied(false);
  }, [options]);

  // Generate on mount and when options change
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      notify.success("Copied to clipboard", {
        description: "Secure password copied to clipboard.",
        id: "pwd-copy",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Failed to copy", {
        description: "Could not copy password to clipboard.",
        id: "pwd-copy-error",
      });
      setError("Failed to copy");
    }
  };

  const toggleOption = (key: keyof Omit<PasswordOptions, "length">) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const strength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 5);
  })();

  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16B889"][strength];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Password Display */}
      <div
        aria-live="polite"
        aria-label="Generated password"
        style={{
          position: "relative",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "16px",
          padding: "20px 24px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          wordBreak: "break-all",
          fontFamily: "'Courier New', monospace",
          fontSize: "1.25rem",
          color: "#f8fafc",
          minHeight: "64px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {password || <span style={{ color: "var(--text-muted)" }}>Generating...</span>}
      </div>

      {/* Strength Indicator */}
      {password && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              flex: 1,
              height: "6px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(strength / 5) * 100}%`,
                height: "100%",
                background: strengthColor,
                borderRadius: "3px",
                transition: "all 0.3s ease",
              }}
            />
          </div>
          <span style={{ color: strengthColor, fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }}>
            {strengthLabel}
          </span>
        </div>
      )}

      {/* Error Message */}
      <div aria-live="polite" role="status">
        {error && (
          <p role="alert" style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem" }}>{error}</p>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Length Slider */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              color: "var(--text-secondary, #94a3b8)",
              fontSize: "0.9rem",
            }}
          >
            <label htmlFor="pw-length">Length</label>
            <span style={{ color: "#f8fafc", fontWeight: 600 }}>{options.length}</span>
          </div>
          <input
            id="pw-length"
            type="range"
            min={6}
            max={64}
            value={options.length}
            onChange={(e) => setOptions((prev) => ({ ...prev, length: Number(e.target.value) }))}
            style={{
              width: "100%",
              accentColor: "#16B889",
              cursor: "pointer",
            }}
          />
        </div>

        {/* Character Type Toggles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
          }}
        >
          {(
            [
              { key: "uppercase", label: "ABC Uppercase" },
              { key: "lowercase", label: "abc Lowercase" },
              { key: "numbers", label: "123 Numbers" },
              { key: "symbols", label: "#@$ Symbols" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleOption(key)}
              aria-pressed={options[key]}
              style={{
                padding: "12px 16px",
                borderRadius: "12px",
                border: `1px solid ${options[key] ? "#16B889" : "rgba(255, 255, 255, 0.1)"}`,
                background: options[key] ? "rgba(22, 184, 137, 0.15)" : "rgba(255, 255, 255, 0.03)",
                color: options[key] ? "#16B889" : "var(--text-secondary, #94a3b8)",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={generatePassword}
          aria-label="Generate a new password"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#f8fafc",
            cursor: "pointer",
            fontSize: "0.95rem",
            fontWeight: 600,
            transition: "all 0.2s ease",
          }}
        >
          Regenerate
        </button>
        <button
          onClick={handleCopy}
          disabled={!password}
          aria-label="Copy password to clipboard"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "none",
            background: copied ? "#16B889" : "#16B889",
            color: "#fff",
            cursor: password ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: password ? 1 : 0.5,
            transition: "all 0.2s ease",
          }}
        >
          {copied ? "Copied!" : "Copy Password"}
        </button>
      </div>
    </div>
  );
}