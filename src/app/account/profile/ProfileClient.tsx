"use client";
import { useState } from "react";
import { User, AtSign, Mail, Phone, MessageCircle, Pencil, X, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";
import styles from "./ProfileClient.module.css";

interface ProfileData {
  id: string;
  email: string;
  emailConfirmedAt: string | null;
  fullName: string | null;
  username: string | null;
  phoneE164: string | null;
  whatsappE164: string | null;
}

interface ProfileClientProps {
  profile: ProfileData;
}

function formatPhone(e164: string | null): string {
  // The DB column may contain non-string values (e.g. numbers), so coerce safely.
  const value = e164 == null ? "" : typeof e164 === "string" ? e164 : String(e164);
  if (!value) return "";
  const m = value.match(/^\+(\d{3})(\d{4})(\d+)$/);
  if (m) return `+${m[1]} ${m[2]}-${m[3]}`;
  return value;
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: profile.fullName || "",
    username: profile.username || "",
    phoneE164: profile.phoneE164 || "",
    whatsappE164: profile.whatsappE164 || "",
  });

  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from("profiles") as any)
        .update({
          full_name: formData.fullName.trim() || null,
          username: formData.username.trim() || null,
          phone_e164: formData.phoneE164.trim() || null,
          whatsapp_e164: formData.whatsappE164.trim() || null,
        })
        .eq("id", profile.id);
      if (updateError) {
        const sanitized = getUserFriendlyError(updateError.message, "Could not update your profile.");
        setError(sanitized);
        notify.error("Unable to update profile", { description: sanitized, id: "profile-error" });
      } else {
        const msg = "Your personal information has been saved.";
        setSuccess("Profile updated successfully");
        notify.success("Profile updated", { description: msg, id: "profile-success" });
        setIsEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      const sanitized = getUserFriendlyError(err, "Failed to update profile.");
      setError(sanitized);
      notify.error("Unable to update profile", { description: sanitized, id: "profile-error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName || "",
      username: profile.username || "",
      phoneE164: profile.phoneE164 || "",
      whatsappE164: profile.whatsappE164 || "",
    });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <User size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Profile</h1>
            <p className={styles.subtitle}>Manage your personal information</p>
          </div>
        </div>
        {!isEditing ? (
          <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
            <Pencil size={16} />
            <span>Edit</span>
          </button>
        ) : (
          <div className={styles.editActions}>
            <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              <Check size={16} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles.alertError}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className={styles.alertSuccess}>
          <ShieldCheck size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Fields */}
      <div className={styles.fields}>
        {/* Full Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>FULL NAME</label>
          <div className={styles.fieldContainer}>
            <User size={18} className={styles.fieldIcon} />
            {isEditing ? (
              <input
                type="text"
                className={styles.input}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
                maxLength={100}
              />
            ) : (
              <span className={styles.value}>
                {profile.fullName || <span className={styles.placeholder}>Not added</span>}
              </span>
            )}
          </div>
        </div>

        {/* Username */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>USERNAME</label>
          <div className={styles.fieldContainer}>
            <AtSign size={18} className={styles.fieldIcon} />
            {isEditing ? (
              <input
                type="text"
                className={styles.input}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Set username"
              />
            ) : (
              <span className={styles.value}>
                {profile.username ? `@ ${profile.username}` : <span className={styles.placeholder}>Set username</span>}
              </span>
            )}
          </div>
        </div>

        {/* Email (read-only) */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>EMAIL</label>
          <div className={styles.fieldContainer}>
            <Mail size={18} className={styles.fieldIcon} />
            <span className={styles.value}>{profile.email}</span>
            {profile.emailConfirmedAt ? (
              <span className={styles.verifiedBadge}>
                <ShieldCheck size={12} />
                Verified
              </span>
            ) : (
              <span className={styles.unverifiedBadge}>Not verified</span>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>PHONE NUMBER</label>
          <div className={styles.fieldContainer}>
            <Phone size={18} className={styles.fieldIcon} />
            {isEditing ? (
              <input
                type="tel"
                className={styles.input}
                value={formData.phoneE164}
                onChange={(e) => setFormData({ ...formData, phoneE164: e.target.value })}
                placeholder="+8801712345678"
              />
            ) : (
              <span className={styles.value}>
                {profile.phoneE164 ? formatPhone(profile.phoneE164) : <span className={styles.placeholder}>Not added</span>}
              </span>
            )}
          </div>
        </div>

        {/* WhatsApp */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>WHATSAPP NUMBER</label>
          <div className={styles.fieldContainer}>
            <MessageCircle size={18} className={styles.fieldIcon} />
            {isEditing ? (
              <input
                type="tel"
                className={styles.input}
                value={formData.whatsappE164}
                onChange={(e) => setFormData({ ...formData, whatsappE164: e.target.value })}
                placeholder="+8801712345678"
              />
            ) : (
              <span className={styles.value}>
                {profile.whatsappE164 ? formatPhone(profile.whatsappE164) : <span className={styles.placeholder}>Not added</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}