"use client";
import { useState, useEffect, useCallback } from "react";
import { notify } from "@/lib/toast";

interface AgeResult {
  years: number;
  months: number;
  days: number;
}

function calculateAge(birthDate: Date, targetDate: Date): AgeResult | null {
  if (birthDate > targetDate) return null;

  let years = targetDate.getFullYear() - birthDate.getFullYear();
  let months = targetDate.getMonth() - birthDate.getMonth();
  let days = targetDate.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    // Get days in previous month of target date
    const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

export function AgeCalculatorClient() {
  const [birthDate, setBirthDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [result, setResult] = useState<AgeResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Set default target date to today on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTargetDate(today);
  }, []);

  useEffect(() => {
    setError("");
    setResult(null);

    if (!birthDate || !targetDate) return;

    const birth = new Date(birthDate + "T00:00:00");
    const target = new Date(targetDate + "T00:00:00");

    if (isNaN(birth.getTime()) || isNaN(target.getTime())) {
      setError("Invalid date format");
      return;
    }

    if (birth > target) {
      setError("Birth date cannot be after the target date");
      return;
    }

    const age = calculateAge(birth, target);
    if (age) {
      setResult(age);
    }
  }, [birthDate, targetDate]);

  const handleReset = () => {
    setBirthDate("");
    setTargetDate(new Date().toISOString().split("T")[0]);
    setResult(null);
    setError("");
    setCopied(false);
  };

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = `${result.years} years, ${result.months} months, ${result.days} days`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify.success("Copied to clipboard", {
        description: "Calculated age copied to clipboard.",
        id: "age-copy",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Failed to copy", {
        description: "Could not copy to clipboard.",
        id: "age-copy-error",
      });
      setError("Failed to copy to clipboard");
    }
  }, [result]);

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
    colorScheme: "dark",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--text-secondary, #94a3b8)",
    fontSize: "0.9rem",
    fontWeight: 600,
    marginBottom: "8px",
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Date Inputs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
        }}
      >
        <div>
          <label htmlFor="birth-date" style={labelStyle}>
            Date of Birth
          </label>
          <input
            id="birth-date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={targetDate || undefined}
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.5)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")
            }
          />
        </div>
        <div>
          <label htmlFor="target-date" style={labelStyle}>
            Calculate Age At
          </label>
          <input
            id="target-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={birthDate || undefined}
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.5)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")
            }
          />
        </div>
      </div>

      {/* Error Message */}
      <div aria-live="polite" role="status">
        {error && (
          <p role="alert" style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div
          aria-live="polite"
          aria-label={`Age result: ${result.years} years, ${result.months} months, ${result.days} days`}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            padding: "24px",
            background: "rgba(245, 158, 11, 0.06)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "20px",
          }}
        >
          {[
            { value: result.years, label: "Years" },
            { value: result.months, label: "Months" },
            { value: result.days, label: "Days" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: "clamp(2rem, 5vw, 2.75rem)",
                  fontWeight: 800,
                  color: "#F59E0B",
                  lineHeight: 1,
                }}
              >
                {item.value}
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary, #94a3b8)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleCopy}
          disabled={!result}
          aria-label="Copy age result to clipboard"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "none",
            background: copied ? "#F59E0B" : "#F59E0B",
            color: "#fff",
            cursor: result ? "pointer" : "not-allowed",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: result ? 1 : 0.5,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          {copied ? "Copied!" : "Copy Result"}
        </button>
        <button
          onClick={handleReset}
          disabled={!birthDate && !targetDate}
          aria-label="Reset calculator"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#f8fafc",
            cursor:
              !birthDate && !targetDate ? "not-allowed" : "pointer",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: !birthDate && !targetDate ? 0.5 : 1,
            transition: "all 0.2s ease",
            minWidth: "140px",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}