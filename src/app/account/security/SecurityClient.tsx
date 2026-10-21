"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Check, X, ShieldCheck, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";

export default function SecurityClient({ email }: { email: string }) {
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!currentPassword) return "Please enter your current password.";
    if (newPassword.length < 8) return "New password must be at least 8 characters.";
    if (newPassword === currentPassword) return "New password must be different from the current one.";
    if (newPassword !== confirmPassword) return "New passwords do not match.";
    return null;
  };

  const handleChange = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      notify.warning("Invalid password", {
        description: validationError,
        id: "password-val",
      });
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Re-authenticate to verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        const msg = "Your current password is incorrect.";
        setError(msg);
        notify.error("Authentication failed", {
          description: msg,
          id: "password-auth-error",
        });
        return;
      }

      // Update to the new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        const sanitized = getUserFriendlyError(updateError.message, "Could not update your password.");
        setError(sanitized);
        notify.error("Password update failed", {
          description: sanitized,
          id: "password-update-error",
        });
        return;
      }

      const msg = "Your password was changed successfully.";
      setSuccess("Password updated successfully");
      notify.success("Password updated", {
        description: msg,
        id: "password-update-success",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowForm(false);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      const sanitized = getUserFriendlyError(err, "Something went wrong. Please try again.");
      setError(sanitized);
      notify.error("Password update failed", {
        description: sanitized,
        id: "password-update-error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {success && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500,
          background: "rgba(16, 185, 129, 0.1)", color: "#059669",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <ShieldCheck size={16} />
          {success}
        </div>
      )}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500,
          background: "rgba(239, 68, 68, 0.1)", color: "#dc2626",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => { setShowForm(true); setError(null); }}
          style={{
            display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8,
            padding: "10px 20px",
            background: "linear-gradient(135deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
            border: "none", borderRadius: 50, color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          <KeyRound size={16} />
          <span>Change Password</span>
        </button>
      ) : (
        <div style={{
          padding: 24,
          background: "var(--account-input-bg, #ffffff)",
          border: "1px solid var(--account-border, #e8e4f8)",
          borderRadius: 16,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--account-text, #242a3a)" }}>Change Password</h3>

          <Field label="CURRENT PASSWORD">
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                style={{ ...inputStyle, paddingRight: 42 }}
                value={currentPassword}
                placeholder="Enter your current password"
                autoComplete="current-password"
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Toggle show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
            </div>
          </Field>

          <Field label="NEW PASSWORD">
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                style={{ ...inputStyle, paddingRight: 42 }}
                value={newPassword}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Toggle show={showNew} onToggle={() => setShowNew(!showNew)} />
            </div>
          </Field>

          <Field label="CONFIRM NEW PASSWORD">
            <input
              type="password"
              style={inputStyle}
              value={confirmPassword}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleChange}
              disabled={saving}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 22px", border: "none", borderRadius: 50, color: "#fff",
                background: "linear-gradient(135deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
                fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
              <span>{saving ? "Updating..." : "Update Password"}</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 22px", border: "1px solid var(--account-border, #e8e4f8)", borderRadius: 50,
                background: "transparent", color: "var(--account-text, #242a3a)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={show ? "Hide password" : "Show password"}
      style={{
        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
        width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--account-muted, #71809c)",
      }}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--account-muted, #71809c)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  border: "1px solid var(--account-border, #e8e4f8)",
  borderRadius: 10,
  background: "var(--account-panel-bg, #ffffff)",
  color: "var(--account-text, #242a3a)",
  fontSize: 14,
  outline: "none",
};