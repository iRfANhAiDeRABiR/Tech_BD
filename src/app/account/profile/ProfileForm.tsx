"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface ProfileData {
  username: string;
  phone_e164: string;
  whatsapp_e164: string;
  address: string;
}

interface ProfileFormProps {
  userId: string;
  email: string;
  initialProfile: ProfileData;
}

export function ProfileForm({ userId, email, initialProfile }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileData>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  const updateField = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.username || formData.username.length < 3 || formData.username.length > 30) {
      setError("Username must be 3-30 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await (supabase.from("profiles") as any)
        .update({
          username: formData.username.trim(),
          phone_e164: formData.phone_e164.trim() || null,
          whatsapp_e164: formData.whatsapp_e164.trim() || null,
          address: formData.address.trim() || null,
        })
        .eq("id", userId);

      if (updateError) {
        if (updateError.code === "23505") {
          setError("That username or phone number is already taken. Please choose another.");
        } else {
          setError(updateError.message || "Failed to update profile.");
        }
        setIsLoading(false);
        return;
      }

      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {error && (
        <div style={{
          padding: "0.75rem 1rem",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          color: "#f87171",
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: "0.75rem 1rem",
          background: "rgba(34, 197, 94, 0.1)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "8px",
          color: "#4ade80",
          fontSize: "0.9rem",
        }}>
          {success}
        </div>
      )}

      {/* Email (read-only) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label htmlFor="profile-email" style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          disabled
          style={{
            padding: "0.7rem 1rem",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-muted)",
            fontSize: "1rem",
            cursor: "not-allowed",
          }}
        />
        <small style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Email cannot be changed
        </small>
      </div>

      {/* Username */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label htmlFor="profile-username" style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
          Username *
        </label>
        <input
          id="profile-username"
          type="text"
          minLength={3}
          maxLength={30}
          value={formData.username}
          onChange={(e) => updateField("username", e.target.value)}
          required
          style={{
            padding: "0.7rem 1rem",
            background: "var(--bg-card, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "1rem",
          }}
        />
        <small style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          3-30 characters, letters, numbers, . _ -
        </small>
      </div>

      {/* Phone */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label htmlFor="profile-phone" style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
          Phone
        </label>
        <input
          id="profile-phone"
          type="tel"
          value={formData.phone_e164}
          onChange={(e) => updateField("phone_e164", e.target.value)}
          placeholder="+880 17..."
          style={{
            padding: "0.7rem 1rem",
            background: "var(--bg-card, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "1rem",
          }}
        />
      </div>

      {/* WhatsApp */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label htmlFor="profile-whatsapp" style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
          WhatsApp
        </label>
        <input
          id="profile-whatsapp"
          type="tel"
          value={formData.whatsapp_e164}
          onChange={(e) => updateField("whatsapp_e164", e.target.value)}
          placeholder="+880 17..."
          style={{
            padding: "0.7rem 1rem",
            background: "var(--bg-card, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "1rem",
          }}
        />
      </div>

      {/* Address */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label htmlFor="profile-address" style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
          Address
        </label>
        <textarea
          id="profile-address"
          rows={3}
          value={formData.address}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="House, Road, Area, City"
          style={{
            padding: "0.7rem 1rem",
            background: "var(--bg-card, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "1rem",
            resize: "vertical",
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "0.7rem 1.5rem",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
        <Link
          href="/account"
          style={{
            padding: "0.7rem 1.5rem",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "1rem",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            transition: "all 0.2s",
          }}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}