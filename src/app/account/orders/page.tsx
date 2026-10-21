import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Package, ShoppingBag, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Orders are stored in the app database via Prisma (see /api/orders),
  // so they must be fetched with Prisma - not the Supabase REST API.
  let orders: Array<{
    id: string;
    orderNumber: string;
    createdAt: Date;
    total: number;
    status: string;
  }> = [];

  try {
    orders = await prisma.order.findMany({
      where: { customerEmail: user.email ?? undefined },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        total: true,
        status: true,
      },
    });
  } catch (e) {
    console.warn("Could not fetch orders:", e);
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "completed" || s === "delivered") return { bg: "rgba(16, 185, 129, 0.1)", color: "#059669" };
    if (s === "pending" || s === "processing") return { bg: "rgba(245, 158, 11, 0.1)", color: "#d97706" };
    if (s === "cancelled" || s === "refunded") return { bg: "rgba(239, 68, 68, 0.1)", color: "#dc2626" };
    return { bg: "rgba(107, 114, 128, 0.1)", color: "#4b5563" };
  };

  return (
    <div style={{
      background: "var(--account-panel-bg, #ffffff)",
      borderRadius: 24,
      border: "1px solid var(--account-border, #e8e4f8)",
      padding: 32,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: "linear-gradient(135deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
        }}>
          <Package size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--account-title, #251ea9)" }}>My Orders</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--account-muted, #71809c)" }}>Track and manage your purchases</p>
        </div>
      </div>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order) => {
            const statusStyle = getStatusColor(order.status);
            return (
              <div key={order.id} style={{
                padding: "20px 24px",
                background: "var(--account-input-bg, #ffffff)",
                border: "1px solid var(--account-border, #e8e4f8)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "rgba(91, 61, 245, 0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--account-primary, #5b3df5)", flexShrink: 0,
                  }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--account-text, #242a3a)", marginBottom: 4 }}>
                      Order #{order.orderNumber}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--account-muted, #71809c)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{
                    padding: "6px 14px",
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    borderRadius: 50,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}>
                    {order.status}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--account-text, #242a3a)", minWidth: 80, textAlign: "right" }}>
                    ৳{order.total.toLocaleString()}
                  </span>
                  <ChevronRight size={18} style={{ color: "var(--account-muted, #71809c)" }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "var(--account-input-bg, #ffffff)",
          border: "1px dashed var(--account-border, #e8e4f8)",
          borderRadius: 20,
        }}>
          <Package size={40} style={{ color: "var(--account-muted, #71809c)", marginBottom: 16, opacity: 0.5 }} />
          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "var(--account-text, #242a3a)" }}>No orders yet</h3>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--account-muted, #71809c)" }}>Your order history will appear here after your first purchase.</p>
          <Link href="/products" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px",
            background: "linear-gradient(135deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
            border: "none", borderRadius: 50, color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "none",
          }}>
            <ShoppingBag size={16} />
            <span>Start Shopping</span>
          </Link>
        </div>
      )}
    </div>
  );
}