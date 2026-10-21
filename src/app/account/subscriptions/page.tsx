import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RefreshCw } from "lucide-react";

export default async function SubscriptionsPage() {
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
          <RefreshCw size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--account-title, #251ea9)" }}>Subscriptions</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--account-muted, #71809c)" }}>Manage your active subscriptions</p>
        </div>
      </div>

      <div style={{
        textAlign: "center", padding: "48px 24px",
        background: "var(--account-input-bg, #ffffff)",
        border: "1px dashed var(--account-border, #e8e4f8)",
        borderRadius: 20,
      }}>
        <RefreshCw size={40} style={{ color: "var(--account-muted, #71809c)", marginBottom: 16, opacity: 0.5 }} />
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "var(--account-text, #242a3a)" }}>No active subscriptions</h3>
        <p style={{ margin: 0, fontSize: 14, color: "var(--account-muted, #71809c)" }}>Your subscription plans will appear here when available.</p>
      </div>
    </div>
  );
}