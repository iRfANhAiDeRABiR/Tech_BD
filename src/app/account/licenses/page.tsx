import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KeyRound, Mail, MessageCircle, ExternalLink, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default async function LicensesPage() {
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
          <KeyRound size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--account-title, #251ea9)" }}>My Licenses</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--account-muted, #71809c)" }}>View and manage your software licenses</p>
        </div>
      </div>

      <div style={{
        textAlign: "center", padding: "48px 24px",
        background: "var(--account-input-bg, #ffffff)",
        border: "1px dashed var(--account-border, #e8e4f8)",
        borderRadius: 20,
        maxWidth: 620,
        margin: "0 auto",
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(91, 61, 245, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px",
          color: "var(--account-primary, #5b3df5)",
        }}>
          <KeyRound size={32} />
        </div>

        <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "var(--account-text, #242a3a)" }}>
          Please check your mailbox or WhatsApp for delivery details
        </h3>
        
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--account-muted, #71809c)", lineHeight: 1.6 }}>
          লাইসেন্স কী এবং সেটআপের বিস্তারিত তথ্যের জন্য অনুগ্রহ করে আপনার ইমেইল (ইনবক্স / স্প্যাম ফোল্ডার) অথবা হোয়াটসঅ্যাপ মেসেজ চেক করুন।
        </p>

        <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--account-muted, #71809c)" }}>
          সাধারণত পেমেন্ট কনফার্মেশনের ৫–৩০ মিনিটের মধ্যে অফিসিয়াল লাইসেন্স ডেলিভারি সম্পন্ন হয়।
        </p>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}>
          <a
            href="https://wa.me/message/7ZV3N6YFBF5ED1"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              background: "#25d366",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(37, 211, 102, 0.25)",
            }}
          >
            <MessageCircle size={16} />
            <span>হোয়াটসঅ্যাপ সাপোর্ট চ্যাট</span>
          </a>

          <Link
            href="/account/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              background: "var(--account-panel-bg, #ffffff)",
              border: "1px solid var(--account-border, #e8e4f8)",
              color: "var(--account-text, #242a3a)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ShoppingBag size={16} />
            <span>অর্ডার স্ট্যাটাস দেখুন</span>
          </Link>

          <Link
            href="/downloads"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              background: "var(--account-panel-bg, #ffffff)",
              border: "1px solid var(--account-border, #e8e4f8)",
              color: "var(--account-text, #242a3a)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={16} />
            <span>সফটওয়্যার ডাউনলোড</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
