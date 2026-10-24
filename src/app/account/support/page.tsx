import { createClient } from "@/lib/supabase/server";
import { SupportTicketsBox } from "@/components/support/SupportTicketsBox";

export const metadata = {
  title: "Support Tickets | Tech Solutions BD",
  description: "View, open, and track your customer support tickets for licenses, downloads, and technical assistance.",
};

export default async function AccountSupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customerName = "User";
  let customerPhone = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username, phone_e164, whatsapp_e164")
      .eq("id", user.id)
      .single();

    customerName =
      profile?.full_name || profile?.username || user.email?.split("@")[0] || "User";
    customerPhone = profile?.phone_e164 || profile?.whatsapp_e164 || "";
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <SupportTicketsBox
        initialUserEmail={user?.email || ""}
        initialUserName={customerName}
        initialUserPhone={customerPhone}
      />
    </div>
  );
}

