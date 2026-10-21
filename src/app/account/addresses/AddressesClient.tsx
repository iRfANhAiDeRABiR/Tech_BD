"use client";

import { useState, useTransition } from "react";
import { MapPin, Plus, Trash2, Star, Loader2 } from "lucide-react";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";
import { addAddress, deleteAddress, setDefaultAddress, type AddressInput } from "./actions";

export interface AddressView {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

const emptyForm = {
  label: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
};

export default function AddressesClient({ addresses }: { addresses: AddressView[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    setError(null);
    startTransition(async () => {
      const input: AddressInput = {
        label: form.label,
        fullName: form.fullName,
        phone: form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
      };
      const result = await addAddress(input);
      if (result.ok) {
        setForm(emptyForm);
        setShowForm(false);
        setSuccess("Address saved successfully");
        notify.success("Address saved", {
          description: "Your address was updated successfully.",
          id: "address-toast",
        });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const sanitized = getUserFriendlyError(result.error, "Could not save address.");
        setError(sanitized);
        notify.error("Unable to save address", {
          description: sanitized,
          id: "address-toast",
        });
      }
    });
  };

  const handleDelete = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAddress(id);
      if (result.ok) {
        notify.info("Address removed", {
          description: "The saved address was removed.",
          id: "address-toast",
        });
      } else {
        const sanitized = getUserFriendlyError(result.error, "Could not remove address.");
        setError(sanitized);
        notify.error("Unable to remove address", {
          description: sanitized,
          id: "address-toast",
        });
      }
    });
  };

  const handleSetDefault = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await setDefaultAddress(id);
      if (result.ok) {
        notify.success("Default address updated", {
          description: "This address is now your default delivery address.",
          id: "address-toast",
        });
      } else {
        const sanitized = getUserFriendlyError(result.error, "Could not update default address.");
        setError(sanitized);
        notify.error("Unable to update default address", {
          description: sanitized,
          id: "address-toast",
        });
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {success && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500,
          background: "rgba(16, 185, 129, 0.1)", color: "#059669",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500,
          background: "rgba(239, 68, 68, 0.1)", color: "#dc2626",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {error}
        </div>
      )}

      {/* Saved Addresses */}
      {addresses.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {addresses.map((address) => (
            <div key={address.id} style={{
              padding: "20px 24px",
              background: "var(--account-input-bg, #ffffff)",
              border: `1px solid ${address.isDefault ? "var(--account-primary, #5b3df5)" : "var(--account-border, #e8e4f8)"}`,
              borderRadius: 16,
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "rgba(91, 61, 245, 0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--account-primary, #5b3df5)",
                }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--account-text, #242a3a)" }}>
                      {address.label || address.fullName}
                    </span>
                    {address.isDefault && (
                      <span style={{
                        padding: "2px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600,
                        background: "rgba(91, 61, 245, 0.1)", color: "var(--account-primary, #5b3df5)",
                      }}>
                        Default
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--account-muted, #71809c)" }}>
                    {address.fullName} · {address.phone}<br />
                    {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}<br />
                    {address.city}{address.state ? `, ${address.state}` : ""}
                    {address.postalCode ? ` ${address.postalCode}` : ""}, {address.country}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    disabled={isPending}
                    title="Set as default"
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: "1px solid var(--account-border, #e8e4f8)",
                      background: "transparent", cursor: isPending ? "wait" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--account-muted, #71809c)",
                    }}
                  >
                    <Star size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  disabled={isPending}
                  title="Delete address"
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(239, 68, 68, 0.3)",
                    background: "transparent", cursor: isPending ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#dc2626",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm && (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "var(--account-input-bg, #ffffff)",
          border: "1px dashed var(--account-border, #e8e4f8)",
          borderRadius: 20,
        }}>
          <MapPin size={40} style={{ color: "var(--account-muted, #71809c)", marginBottom: 16, opacity: 0.5 }} />
          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "var(--account-text, #242a3a)" }}>No addresses saved</h3>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--account-muted, #71809c)" }}>Add a delivery address to speed up checkout.</p>
        </div>
      )}

      {/* Add Address */}
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
          <Plus size={16} />
          <span>Add Address</span>
        </button>
      ) : (
        <div style={{
          padding: 24,
          background: "var(--account-input-bg, #ffffff)",
          border: "1px solid var(--account-border, #e8e4f8)",
          borderRadius: 16,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--account-text, #242a3a)" }}>New Address</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <Field label="Label (optional)">
              <input style={inputStyle} value={form.label} placeholder="Home, Office..."
                onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </Field>
            <Field label="Full Name *">
              <input style={inputStyle} value={form.fullName} placeholder="Your full name"
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Phone *">
              <input style={inputStyle} value={form.phone} placeholder="+8801712345678"
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="City *">
              <input style={inputStyle} value={form.city} placeholder="Dhaka"
                onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="State / Division">
              <input style={inputStyle} value={form.state} placeholder="Dhaka"
                onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
            <Field label="Postal Code">
              <input style={inputStyle} value={form.postalCode} placeholder="1200"
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
            </Field>
          </div>
          <Field label="Address Line 1 *">
            <input style={inputStyle} value={form.addressLine1} placeholder="House / Street / Area"
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
          </Field>
          <Field label="Address Line 2">
            <input style={inputStyle} value={form.addressLine2} placeholder="Apartment, floor, landmark (optional)"
              onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
          </Field>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 22px", border: "none", borderRadius: 50, color: "#fff",
                background: "linear-gradient(135deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
                fontSize: 14, fontWeight: 600, cursor: isPending ? "wait" : "pointer", opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending && <Loader2 size={16} className="spin" />}
              <span>{isPending ? "Saving..." : "Save Address"}</span>
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(emptyForm); setError(null); }}
              disabled={isPending}
              style={{
                padding: "10px 22px", border: "1px solid var(--account-border, #e8e4f8)", borderRadius: 50,
                background: "transparent", color: "var(--account-text, #242a3a)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--account-muted, #71809c)" }}>
        {label.toUpperCase()}
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