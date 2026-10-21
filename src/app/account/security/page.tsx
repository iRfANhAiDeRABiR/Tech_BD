import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Lock, Mail, ShieldCheck, Clock } from "lucide-react";
import SecurityClient from "./SecurityClient";

export default async function SecurityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div style={{
      background: "var(--account-panel-bg, #ffffff)",
      borderRadius: 24,
      border: "1px solid var(--account-border, #e8e4f8)",
      padding: 32,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: "linear-gradient(135deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
        }}>
          <Lock size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--account-title, #251ea9)" }}>Security</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--account-muted, #71809c)" }}>Manage password and account security</p>
        </div>
      </div>

      {/* Email Verification Section */}
      <div style={{
        padding: 24,
        background: "var(--account-input-bg, #ffffff)",
        border: "1px solid var(--account-border, #e8e4f8)",
        borderRadius: 20,
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Mail size={20} style={{ color: "var(--account-muted, #71809c)" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--account-text, #242a3a)" }}>Email Verification</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: "var(--account-text, #242a3a)" }}>{user.email}</span>
          {user.email_confirmed_at ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", background: "rgba(16, 185, 129, 0.1)",
              borderRadius: 50, color: "#059669", fontSize: 13, fontWeight: 600,
            }}>
              <ShieldCheck size={14} /> Verified
            </span>
          ) : (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", background: "rgba(245, 158, 11, 0.1)",
              borderRadius: 50, color: "#d97706", fontSize: 13, fontWeight: 600,
            }}>Not verified</span>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div style={{
        padding: 24,
        background: "var(--account-input-bg, #ffffff)",
        border: "1px solid var(--account-border, #e8e4f8)",
        borderRadius: 20,
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Lock size={20} style={{ color: "var(--account-muted, #71809c)" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--account-text, #242a3a)" }}>Password</h3>
        </div>
        <SecurityClient email={user.email || ""} />
      </div>

      {/* Active Session Section */}
      <div style={{
        padding: 24,
        background: "var(--account-input-bg, #ffffff)",
        border: "1px solid var(--account-border, #e8e4f8)",
        borderRadius: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Clock size={20} style={{ color: "var(--account-muted, #71809c)" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--account-text, #242a3a)" }}>Active Session</h3>
        </div>
        <div style={{ fontSize: 14, color: "var(--account-text, #242a3a)" }}>
          <p style={{ margin: "0 0 8px" }}>Current session active</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--account-muted, #71809c)" }}>
            Last login: {new Date(user.last_sign_in_at || Date.now()).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}