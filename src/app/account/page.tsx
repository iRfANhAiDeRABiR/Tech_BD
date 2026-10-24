import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  User,
  Package,
  KeyRound,
  Download,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  LifeBuoy,
  Plus,
} from "lucide-react";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import { getAllSupportTicketsServer } from "@/lib/support-tickets-store";
import { formatRelativeTime } from "@/lib/support-ticket-storage";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, phone_e164, whatsapp_e164")
    .eq("id", user.id)
    .single();

  // Orders are stored in the app database via Prisma (see /api/orders),
  // so they must be fetched with Prisma - not the Supabase REST API.
  let totalOrders = 0;
  let recentOrders: Array<{
    id: string;
    orderNumber: string;
    createdAt: Date;
    total: number;
    status: string;
  }> = [];

  try {
    [totalOrders, recentOrders] = await Promise.all([
      prisma.order.count({ where: { customerEmail: user.email ?? undefined } }),
      prisma.order.findMany({
        where: { customerEmail: user.email ?? undefined },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          total: true,
          status: true,
        },
      }),
    ]);
  } catch (e) {
    console.warn("Could not fetch orders:", e);
  }

  // Fetch support tickets for this user
  let userTickets: any[] = [];
  try {
    if (user.email) {
      userTickets = await getAllSupportTicketsServer({ search: user.email });
    }
  } catch (e) {
    console.warn("Could not fetch user tickets:", e);
  }

  const activeTicketsCount = userTickets.filter(
    (t) => t.status === "Open" || t.status === "In Progress"
  ).length;
  const totalTicketsCount = userTickets.length;
  const recentTickets = userTickets.slice(0, 3);

  // Calculate profile completion
  const fields = [
    !!profile?.full_name,
    !!profile?.username,
    !!user.email_confirmed_at,
    !!profile?.phone_e164,
    !!profile?.whatsapp_e164,
  ];
  const completedFields = fields.filter(Boolean).length;
  const completionPercent = Math.round((completedFields / fields.length) * 100);

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "completed" || s === "delivered")
      return { bg: "rgba(16, 185, 129, 0.1)", color: "#059669" };
    if (s === "pending" || s === "processing")
      return { bg: "rgba(245, 158, 11, 0.1)", color: "#d97706" };
    if (s === "cancelled" || s === "refunded")
      return { bg: "rgba(239, 68, 68, 0.1)", color: "#dc2626" };
    return { bg: "rgba(107, 114, 128, 0.1)", color: "#4b5563" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome Header */}
      <div
        style={{
          background: "var(--account-panel-bg, #ffffff)",
          borderRadius: 24,
          border: "1px solid var(--account-border, #e8e4f8)",
          padding: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
            <User size={24} />
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
              Welcome back,{" "}
              {profile?.full_name ||
                profile?.username ||
                user.email?.split("@")[0] ||
                "User"}
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 14,
                color: "var(--account-muted, #71809c)",
              }}
            >
              Manage your account and purchases
            </p>
          </div>
        </div>

        {/* Profile Completion */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--account-text, #242a3a)",
              }}
            >
              Profile Completion
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--account-primary, #5b3df5)",
              }}
            >
              {completionPercent}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "var(--account-border, #e8e4f8)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${completionPercent}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
                borderRadius: 4,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        <Link
          href="/account/orders"
          style={{
            background: "var(--account-panel-bg, #ffffff)",
            borderRadius: 20,
            border: "1px solid var(--account-border, #e8e4f8)",
            padding: 24,
            textDecoration: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(91, 61, 245, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--account-primary, #5b3df5)",
              }}
            >
              <Package size={20} />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--account-text, #242a3a)",
              }}
            >
              My Orders
            </span>
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--account-title, #251ea9)",
            }}
          >
            {totalOrders}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--account-muted, #71809c)",
              marginTop: 4,
            }}
          >
            total orders
          </div>
        </Link>

        <Link
          href="/account/licenses"
          style={{
            background: "var(--account-panel-bg, #ffffff)",
            borderRadius: 20,
            border: "1px solid var(--account-border, #e8e4f8)",
            padding: 24,
            textDecoration: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(91, 61, 245, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--account-primary, #5b3df5)",
              }}
            >
              <KeyRound size={20} />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--account-text, #242a3a)",
              }}
            >
              My Licenses
            </span>
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--account-title, #251ea9)",
            }}
          >
            —
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--account-muted, #71809c)",
              marginTop: 4,
            }}
          >
            available
          </div>
        </Link>

        <Link
          href="/account/downloads"
          style={{
            background: "var(--account-panel-bg, #ffffff)",
            borderRadius: 20,
            border: "1px solid var(--account-border, #e8e4f8)",
            padding: 24,
            textDecoration: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(91, 61, 245, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--account-primary, #5b3df5)",
              }}
            >
              <Download size={20} />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--account-text, #242a3a)",
              }}
            >
              Downloads
            </span>
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--account-title, #251ea9)",
            }}
          >
            —
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--account-muted, #71809c)",
              marginTop: 4,
            }}
          >
            files
          </div>
        </Link>

        {/* Support Tickets Quick Stat */}
        <Link
          href="/account/support"
          style={{
            background: "var(--account-panel-bg, #ffffff)",
            borderRadius: 20,
            border: "1px solid var(--account-border, #e8e4f8)",
            padding: 24,
            textDecoration: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(234, 88, 12, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ea580c",
              }}
            >
              <LifeBuoy size={20} />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--account-text, #242a3a)",
              }}
            >
              Support Tickets
            </span>
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--account-title, #251ea9)",
            }}
          >
            {activeTicketsCount}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--account-muted, #71809c)",
              marginTop: 4,
            }}
          >
            {totalTicketsCount} total • history &amp; reply
          </div>
        </Link>

        <Link
          href="/account/profile"
          style={{
            background: "var(--account-panel-bg, #ffffff)",
            borderRadius: 20,
            border: "1px solid var(--account-border, #e8e4f8)",
            padding: 24,
            textDecoration: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(91, 61, 245, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--account-primary, #5b3df5)",
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--account-text, #242a3a)",
              }}
            >
              Profile
            </span>
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--account-title, #251ea9)",
            }}
          >
            {completionPercent}%
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--account-muted, #71809c)",
              marginTop: 4,
            }}
          >
            complete
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div
        style={{
          background: "var(--account-panel-bg, #ffffff)",
          borderRadius: 24,
          border: "1px solid var(--account-border, #e8e4f8)",
          padding: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--account-title, #251ea9)",
            }}
          >
            Recent Orders
          </h2>
          <Link
            href="/account/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--account-primary, #5b3df5)",
              textDecoration: "none",
            }}
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentOrders.map((order) => {
              const statusStyle = getStatusColor(order.status);
              return (
                <div
                  key={order.id}
                  style={{
                    padding: "16px 20px",
                    background: "var(--account-input-bg, #ffffff)",
                    border: "1px solid var(--account-border, #e8e4f8)",
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "rgba(91, 61, 245, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--account-primary, #5b3df5)",
                        flexShrink: 0,
                      }}
                    >
                      <Package size={18} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--account-text, #242a3a)",
                        }}
                      >
                        Order #{order.orderNumber}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--account-muted, #71809c)",
                        }}
                      >
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        padding: "4px 12px",
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: 50,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {order.status}
                    </span>
                    <PriceDisplay
                      inline
                      price={order.total}
                      showDiscount={false}
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--account-text, #242a3a)",
                        minWidth: 60,
                        textAlign: "right",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "32px 20px",
              background: "var(--account-input-bg, #ffffff)",
              border: "1px dashed var(--account-border, #e8e4f8)",
              borderRadius: 16,
            }}
          >
            <Package
              size={32}
              style={{
                color: "var(--account-muted, #71809c)",
                marginBottom: 12,
                opacity: 0.5,
              }}
            />
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 14,
                color: "var(--account-muted, #71809c)",
              }}
            >
              No orders yet.
            </p>
            <Link
              href="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                background:
                  "linear-gradient(135deg, var(--account-primary, #5b3df5), var(--account-primary-2, #7c3aed))",
                border: "none",
                borderRadius: 50,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <ShoppingBag size={14} />
              <span>Start Shopping</span>
            </Link>
          </div>
        )}
      </div>

      {/* ── Support Tickets & Assistance Section ── */}
      <div
        style={{
          background: "var(--account-panel-bg, #ffffff)",
          borderRadius: 24,
          border: "1px solid var(--account-border, #e8e4f8)",
          padding: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(234, 88, 12, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ea580c",
              }}
            >
              <LifeBuoy size={22} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--account-title, #251ea9)",
                }}
              >
                Support Tickets &amp; Assistance
              </h2>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--account-muted, #71809c)",
                }}
              >
                {activeTicketsCount} active • {totalTicketsCount} total
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/account/support?create=true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                background: "#ea580c",
                borderRadius: 50,
                color: "#ffffff",
                fontSize: 12.5,
                fontWeight: 650,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
              }}
            >
              <Plus size={14} />
              <span>Open New Ticket</span>
            </Link>

            <Link
              href="/account/support"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--account-primary, #5b3df5)",
                textDecoration: "none",
              }}
            >
              View All History <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {recentTickets.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentTickets.map((ticket: any) => {
              const isOpen =
                ticket.status === "Open" || ticket.status === "In Progress";
              return (
                <Link
                  key={ticket.id}
                  href="/account/support"
                  style={{
                    padding: "16px 20px",
                    background: "var(--account-input-bg, #ffffff)",
                    border: "1px solid var(--account-border, #e8e4f8)",
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textDecoration: "none",
                    transition: "border-color 0.15s",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#6366f1",
                        background: "rgba(99, 102, 241, 0.1)",
                        padding: "2px 8px",
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    >
                      #{ticket.ticketCode}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--account-text, #242a3a)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {ticket.subject}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--account-muted, #71809c)",
                        }}
                      >
                        {ticket.category} • {ticket.messages?.length || 1}{" "}
                        messages • {formatRelativeTime(ticket.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 50,
                        fontSize: 11.5,
                        fontWeight: 650,
                        background: isOpen
                          ? "rgba(245, 158, 11, 0.12)"
                          : "rgba(16, 185, 129, 0.12)",
                        color: isOpen ? "#d97706" : "#059669",
                      }}
                    >
                      {ticket.status}
                    </span>
                    <ChevronRight
                      size={16}
                      color="var(--account-muted, #71809c)"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "28px 20px",
              background: "var(--account-input-bg, #ffffff)",
              border: "1px dashed var(--account-border, #e8e4f8)",
              borderRadius: 16,
            }}
          >
            <LifeBuoy
              size={32}
              style={{
                color: "#ea580c",
                marginBottom: 8,
                opacity: 0.6,
              }}
            />
            <p
              style={{
                margin: "0 0 14px",
                fontSize: 13.5,
                color: "var(--account-muted, #71809c)",
              }}
            >
              No support tickets yet. Need help with activation keys,
              installation, or payment verification?
            </p>
            <Link
              href="/account/support?create=true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                background: "#ea580c",
                borderRadius: 50,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Plus size={14} />
              <span>Open Support Ticket</span>
            </Link>
          </div>
        )}
      </div>

      {/* Account Details Summary */}
      <div
        style={{
          background: "var(--account-panel-bg, #ffffff)",
          borderRadius: 24,
          border: "1px solid var(--account-border, #e8e4f8)",
          padding: 32,
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--account-title, #251ea9)",
          }}
        >
          Account Details
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: user.email_confirmed_at
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(245, 158, 11, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: user.email_confirmed_at ? "#059669" : "#d97706",
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <span
              style={{
                fontSize: 14,
                color: "var(--account-text, #242a3a)",
              }}
            >
              Email {user.email_confirmed_at ? "verified" : "not verified"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: profile?.phone_e164
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(245, 158, 11, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: profile?.phone_e164 ? "#059669" : "#d97706",
              }}
            >
              <User size={16} />
            </div>
            <span
              style={{
                fontSize: 14,
                color: "var(--account-text, #242a3a)",
              }}
            >
              Phone {profile?.phone_e164 ? "added" : "not added"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
