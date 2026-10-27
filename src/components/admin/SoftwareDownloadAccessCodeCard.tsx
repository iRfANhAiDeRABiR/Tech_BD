"use client";

import { useState } from "react";
import { KeyRound, Copy, Check, Eye, EyeOff, RefreshCw, Sparkles, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { notify } from "@/lib/toast";
import type { DownloadAccessCode } from "@/lib/download-access-code-store";
import { saveDownloadAccessCodeAction, toggleDownloadAccessCodeAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";

interface SoftwareDownloadAccessCodeCardProps {
  accessCode: DownloadAccessCode | null;
}

export function SoftwareDownloadAccessCodeCard({
  accessCode,
}: SoftwareDownloadAccessCodeCardProps) {
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputCode, setInputCode] = useState(accessCode?.code || "TECHBD-VIP-ACCESS");
  const [inputLabel, setInputLabel] = useState(accessCode?.label || "Master Download Access Code");
  const [isActive, setIsActive] = useState(accessCode?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const currentCode = accessCode?.code || "TECHBD-VIP-ACCESS";

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopiedCode(true);
      notify.success("Access Code Copied", {
        description: `Code "${currentCode}" copied to clipboard.`,
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyDirectLink = async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const directUrl = `${origin}/downloads?code=${encodeURIComponent(currentCode)}`;
      await navigator.clipboard.writeText(directUrl);
      setCopiedLink(true);
      notify.success("Direct Link Copied", {
        description: "Direct auto-unlock download link copied to clipboard.",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleGenerateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInputCode(`TECHBD-VIP-${randomPart}`);
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "28px",
        boxShadow: "0 8px 24px -6px rgba(0, 0, 0, 0.35)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative accent glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "250px",
          height: "100%",
          background: "radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: "rgba(14, 165, 233, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
              }}
            >
              <KeyRound size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                Secret Download Access Code (গোপন ডাউনলোড অ্যাক্সেস কোড)
              </h2>
              <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                Users or guests can enter this code instead of an Order ID to directly unlock all downloads. Main website UI remains unchanged.
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge & Toggle Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.78rem",
              fontWeight: 600,
              backgroundColor: accessCode?.isActive !== false ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: accessCode?.isActive !== false ? "#34d399" : "#f87171",
              border: `1px solid ${accessCode?.isActive !== false ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            }}
          >
            {accessCode?.isActive !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {accessCode?.isActive !== false ? "Active (সক্রিয়)" : "Inactive (নিষ্ক্রিয়)"}
          </span>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={styles.buttonSecondary}
            style={{ fontSize: "0.84rem", padding: "6px 14px" }}
          >
            {isEditing ? "Cancel" : "Change Code"}
          </button>
        </div>
      </div>

      {/* Code Display Row */}
      {!isEditing && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            padding: "14px 18px",
            backgroundColor: "rgba(2, 6, 23, 0.6)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.84rem", color: "#94a3b8", fontWeight: 500 }}>Active Code:</span>
            <code
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#38bdf8",
                letterSpacing: "0.08em",
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                padding: "4px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(14, 165, 233, 0.25)",
              }}
            >
              {showCode ? currentCode : "••••••••••••••••"}
            </code>

            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              title={showCode ? "Hide code" : "Reveal code"}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <button
              type="button"
              onClick={handleCopyCode}
              className={styles.buttonSecondary}
              style={{ fontSize: "0.82rem", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {copiedCode ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              <span>{copiedCode ? "Copied Code" : "Copy Code"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyDirectLink}
              className={styles.buttonSecondary}
              style={{
                fontSize: "0.82rem",
                padding: "6px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderColor: "rgba(14, 165, 233, 0.4)",
                color: "#38bdf8",
              }}
            >
              {copiedLink ? <Check size={14} color="#34d399" /> : <Sparkles size={14} />}
              <span>{copiedLink ? "Link Copied!" : "Copy Direct URL"}</span>
            </button>
          </div>

          {/* Usage Metrics */}
          <div
            style={{
              width: "100%",
              marginTop: 6,
              paddingTop: 10,
              borderTop: "1px dashed rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.8rem",
              color: "#94a3b8",
            }}
          >
            <span>
              🏷️ <b>Label:</b> {accessCode?.label || "Master Download Access Code"}
            </span>
            <span>
              📊 <b>Used:</b> <strong style={{ color: "#f8fafc" }}>{accessCode?.usageCount ?? 0} times</strong>
              {accessCode?.lastUsedAt && (
                <span> (Last: {new Date(accessCode.lastUsedAt).toLocaleDateString("en-GB")})</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Code Edit Form */}
      {isEditing && (
        <form
          action={async (formData) => {
            setIsSaving(true);
            try {
              await saveDownloadAccessCodeAction(formData);
              notify.success("Access Code Saved", {
                description: "Secret download access code has been updated successfully.",
              });
              setIsEditing(false);
            } catch (err: any) {
              notify.error("Update Failed", { description: err.message });
            } finally {
              setIsSaving(false);
            }
          }}
          style={{
            marginTop: 18,
            padding: "18px 20px",
            backgroundColor: "rgba(2, 6, 23, 0.7)",
            borderRadius: "8px",
            border: "1px solid rgba(56, 189, 248, 0.3)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                Secret Access Code (গোপন কোড):
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  name="code"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="e.g. TECHBD-VIP-ACCESS"
                  required
                  className={styles.input}
                  style={{ fontWeight: 700, letterSpacing: "0.06em", color: "#38bdf8" }}
                />
                <button
                  type="button"
                  onClick={handleGenerateRandomCode}
                  title="Generate Random Code"
                  className={styles.buttonSecondary}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", whiteSpace: "nowrap" }}
                >
                  <RefreshCw size={14} /> Randomize
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                Description / Purpose Label:
              </label>
              <input
                type="text"
                name="label"
                value={inputLabel}
                onChange={(e) => setInputLabel(e.target.value)}
                placeholder="e.g. VIP Customer Support Key"
                className={styles.input}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.84rem", color: "#cbd5e1" }}>
              <input
                type="checkbox"
                name="isActive"
                value="true"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#0ea5e9" }}
              />
              <span>Enable this code for direct access without Order ID</span>
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={styles.buttonSecondary}
                style={{ fontSize: "0.84rem" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={styles.button}
                style={{ fontSize: "0.84rem", padding: "8px 18px" }}
              >
                {isSaving ? "Saving..." : "Save Access Code"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

