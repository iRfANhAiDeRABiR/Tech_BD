import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import OrdersListClient, { type OrderDetailView } from "./OrdersListClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  let orders: OrderDetailView[] = [];

  try {
    const rawOrders = await prisma.order.findMany({
      where: user.email
        ? {
            customerEmail: {
              equals: user.email,
              mode: "insensitive",
            },
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
                slug: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    orders = rawOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      subtotal: o.subtotal,
      discount: o.discount,
      total: o.total,
      currency: o.currency,
      status: o.status,
      notes: o.notes,
      couponCode: o.couponCode,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((it) => ({
        id: it.id,
        productName: it.productName,
        productOptionName: it.productOptionName,
        productOptionType: it.productOptionType,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        product: it.product
          ? {
              name: it.product.name,
              image: it.product.image,
              slug: it.product.slug,
            }
          : null,
      })),
      payment: o.payment
        ? {
            id: o.payment.id,
            method: o.payment.method,
            transactionId: o.payment.transactionId,
            senderNumber: o.payment.senderNumber,
            paymentNumber: o.payment.paymentNumber,
            amount: o.payment.amount,
            status: o.payment.status,
            verifiedAt: o.payment.verifiedAt ? o.payment.verifiedAt.toISOString() : null,
          }
        : null,
    }));
  } catch (e) {
    console.warn("Could not fetch orders:", e);
  }

  return (
    <div
      style={{
        background: "var(--account-panel-bg, #ffffff)",
        borderRadius: 24,
        border: "1px solid var(--account-border, #e8e4f8)",
        padding: 32,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background:
              "linear-gradient(135deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <Package size={24} />
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "var(--account-title, #251ea9)",
            }}
          >
            My Orders
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 14,
              color: "var(--account-muted, #71809c)",
            }}
          >
            Track and manage your purchases
          </p>
        </div>
      </div>

      {/* Orders List / Empty State */}
      {orders.length > 0 ? (
        <OrdersListClient orders={orders} />
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "var(--account-input-bg, #ffffff)",
            border: "1px dashed var(--account-border, #e8e4f8)",
            borderRadius: 20,
          }}
        >
          <Package
            size={40}
            style={{
              color: "var(--account-muted, #71809c)",
              marginBottom: 16,
              opacity: 0.5,
            }}
          />
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--account-text, #242a3a)",
            }}
          >
            No orders yet
          </h3>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 14,
              color: "var(--account-muted, #71809c)",
            }}
          >
            Your order history will appear here after your first purchase.
          </p>
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background:
                "linear-gradient(135deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
              border: "none",
              borderRadius: 50,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <ShoppingBag size={16} />
            <span>Start Shopping</span>
          </Link>
        </div>
      )}
    </div>
  );
}
