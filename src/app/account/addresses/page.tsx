import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { MapPin } from "lucide-react";
import AddressesClient, { type AddressView } from "./AddressesClient";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Addresses are stored in the app database via Prisma.
  let addresses: AddressView[] = [];
  try {
    const rows = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    addresses = rows.map((row) => ({
      id: row.id,
      label: row.label,
      fullName: row.fullName,
      phone: row.phone,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      country: row.country,
      isDefault: row.isDefault,
    }));
  } catch (e) {
    console.warn("Could not fetch addresses:", e);
  }

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
          <MapPin size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--account-title, #251ea9)" }}>Addresses</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--account-muted, #71809c)" }}>Manage your saved delivery and billing addresses</p>
        </div>
      </div>

      <AddressesClient addresses={addresses} />
    </div>
  );
}