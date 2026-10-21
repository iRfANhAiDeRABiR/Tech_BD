"use client";
import { useState, useMemo, useCallback } from "react";
import { notify } from "@/lib/toast";

export function ProfitCalculatorClient() {
  const [costPrice, setCostPrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const cost = parseFloat(costPrice);
    const sell = parseFloat(sellingPrice);
    const qty = parseFloat(quantity) || 1;

    if (isNaN(cost) || isNaN(sell)) return null;

    const totalCost = cost * qty;
    const totalRevenue = sell * qty;
    const profitAmount = totalRevenue - totalCost;
    const margin = totalRevenue !== 0 ? (profitAmount / totalRevenue) * 100 : 0;
    const markup = cost !== 0 ? (profitAmount / totalCost) * 100 : 0;

    return {
      totalCost,
      totalRevenue,
      profitAmount,
      margin,
      markup,
      isProfit: profitAmount >= 0,
    };
  }, [costPrice, sellingPrice, quantity]);

  const handleReset = () => {
    setCostPrice("");
    setSellingPrice("");
    setQuantity("1");
    setCopied(false);
  };

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = `${result.isProfit ? "Profit" : "Loss"}: $${result.profitAmount.toFixed(2)}, Margin: ${result.margin.toFixed(2)}%, Markup: ${result.markup.toFixed(2)}%`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify.success("Copied to clipboard", {
        description: "Profit calculation copied to clipboard.",
        id: "profit-copy",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Failed to copy", {
        description: "Could not copy calculation to clipboard.",
        id: "profit-copy-error",
      });
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
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--text-secondary, #94a3b8)",
    fontSize: "0.9rem",
    fontWeight: 600,
    marginBottom: "8px",
    display: "block",
  };

  const accentColor = "#10B981";
  const lossColor = "#ef4444";
  const activeColor = result?.isProfit ? accentColor : lossColor;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Inputs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        <div>
          <label htmlFor="cost-price" style={labelStyle}>
            Cost Price ($)
          </label>
          <input
            id="cost-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.5)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")
            }
          />
        </div>
        <div>
          <label htmlFor="selling-price" style={labelStyle}>
            Selling Price ($)
          </label>
          <input
            id="selling-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.5)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")
            }
          />
        </div>
        <div>
          <label htmlFor="quantity" style={labelStyle}>
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.5)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)")
            }
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div
          aria-live="polite"
          aria-label={`Calculation result: ${result.isProfit ? "Profit" : "Loss"} $${result.profitAmount.toFixed(2)}, Margin ${result.margin.toFixed(2)}%, Markup ${result.markup.toFixed(2)}%`}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
            padding: "24px",
            background: `${activeColor}0F`,
            border: `1px solid ${activeColor}33`,
            borderRadius: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary, #94a3b8)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {result.isProfit ? "Profit" : "Loss"}
            </span>
            <span
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 800,
                color: activeColor,
                lineHeight: 1.2,
              }}
            >
              {result.isProfit ? "+" : ""}
              {result.profitAmount.toFixed(2)}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary, #94a3b8)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Margin
            </span>
            <span
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 800,
                color: "#f8fafc",
                lineHeight: 1.2,
              }}
            >
              {result.margin.toFixed(2)}%
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary, #94a3b8)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Markup
            </span>
            <span
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 800,
                color: "#f8fafc",
                lineHeight: 1.2,
              }}
            >
              {result.markup.toFixed(2)}%
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary, #94a3b8)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Revenue
            </span>
            <span
              style={{
                fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                fontWeight: 700,
                color: "var(--text-secondary, #94a3b8)",
                lineHeight: 1.2,
              }}
            >
              {result.totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleCopy}
          disabled={!result}
          aria-label="Copy calculation result to clipboard"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "none",
            background: copied ? activeColor : activeColor,
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
          disabled={!costPrice && !sellingPrice}
          aria-label="Reset calculator"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#f8fafc",
            cursor:
              !costPrice && !sellingPrice ? "not-allowed" : "pointer",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: !costPrice && !sellingPrice ? 0.5 : 1,
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