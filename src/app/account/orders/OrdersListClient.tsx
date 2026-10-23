"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  KeyRound,
  FileText,
  CreditCard,
  User,
} from "lucide-react";
import styles from "./OrdersList.module.css";
import { useCurrency } from "@/context/CurrencyContext";

export interface OrderItemView {
  id: string;
  productName: string;
  productOptionName: string | null;
  productOptionType: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: {
    name: string;
    image: string | null;
    slug: string;
  } | null;
}

export interface PaymentSubmissionView {
  id: string;
  method: string;
  transactionId: string;
  senderNumber: string | null;
  paymentNumber: string | null;
  amount: number;
  status: string;
  verifiedAt: string | Date | null;
}

export interface OrderDetailView {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  status: string;
  notes: string | null;
  couponCode: string | null;
  createdAt: string | Date;
  items: OrderItemView[];
  payment?: PaymentSubmissionView | null;
}

interface OrdersListClientProps {
  orders: OrderDetailView[];
}

function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return "Mobile Banking";
  const m = method.toUpperCase();
  if (m === "BKASH") return "bKash";
  if (m === "NAGAD") return "Nagad";
  if (m === "ROCKET") return "Rocket";
  if (m === "UPAY") return "Upay";
  if (m === "BANK_TRANSFER") return "Bank Transfer";
  return method;
}

export default function OrdersListClient({ orders }: OrdersListClientProps) {
  const { formatPrice } = useCurrency();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleOrder = (orderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "completed" || s === "delivered") {
      return {
        bg: "rgba(16, 185, 129, 0.12)",
        color: "#059669",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        label: "Completed",
      };
    }
    if (s === "payment_submitted") {
      return {
        bg: "rgba(245, 158, 11, 0.12)",
        color: "#d97706",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        label: "Verification Pending",
      };
    }
    if (s === "pending" || s === "pending_payment" || s === "processing") {
      return {
        bg: "rgba(59, 130, 246, 0.12)",
        color: "#2563eb",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        label: "Processing",
      };
    }
    if (s === "cancelled" || s === "refunded" || s === "rejected") {
      return {
        bg: "rgba(239, 68, 68, 0.12)",
        color: "#dc2626",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        label: "Cancelled",
      };
    }
    return {
      bg: "rgba(107, 114, 128, 0.12)",
      color: "#4b5563",
      border: "1px solid rgba(107, 114, 128, 0.2)",
      label: status,
    };
  };

  return (
    <div className={styles.ordersContainer}>
      {orders.map((order) => {
        const isExpanded = expandedIds.has(order.id);
        const statusBadge = getStatusBadge(order.status);
        const isCompleted = order.status?.toLowerCase() === "completed" || order.status?.toLowerCase() === "delivered";
        const isPending = order.status?.toLowerCase() === "payment_submitted" || order.status?.toLowerCase().includes("pending");
        const isFailed = order.status?.toLowerCase() === "cancelled" || order.status?.toLowerCase() === "rejected";

        const paymentGateway = formatPaymentMethod(order.payment?.method);
        const trxId = order.payment?.transactionId;
        const senderNumber = order.payment?.senderNumber;

        return (
          <div
            key={order.id}
            className={`${styles.orderCard} ${isExpanded ? styles.orderCardExpanded : ""}`}
          >
            {/* Clickable Header Row: Click card or > button */}
            <button
              type="button"
              className={styles.orderHeader}
              onClick={() => toggleOrder(order.id)}
              aria-expanded={isExpanded}
              aria-label={`Toggle details for Order #${order.orderNumber}`}
            >
              <div className={styles.orderHeaderLeft}>
                <div className={styles.orderIcon}>
                  <Package size={20} />
                </div>
                <div className={styles.orderInfo}>
                  <div className={styles.orderNumber}>
                    Order #{order.orderNumber}
                  </div>
                  <div className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.orderHeaderRight}>
                <span
                  className={styles.orderStatusBadge}
                  style={{
                    background: statusBadge.bg,
                    color: statusBadge.color,
                    border: statusBadge.border,
                  }}
                >
                  {statusBadge.label}
                </span>

                <span className={styles.orderPrice} suppressHydrationWarning>
                  {formatPrice(order.total)}
                </span>

                {/* Animated Chevron Arrow button */}
                <span
                  className={`${styles.chevronIcon} ${
                    isExpanded ? styles.chevronIconExpanded : ""
                  }`}
                  title={isExpanded ? "Collapse details" : "Expand details"}
                >
                  <ChevronRight size={18} />
                </span>
              </div>
            </button>

            {/* Expanded Order Info Details */}
            {isExpanded && (
              <div className={styles.orderDetails}>
                {/* 1. Status Notice Banner */}
                {isCompleted && (
                  <div className={`${styles.statusMessageCard} ${styles.statusMessageCompleted}`}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: "13px", lineHeight: "1.45" }}>
                      <strong>পেমেন্ট অনুমোদিত ও অর্ডার সম্পন্ন!</strong>
                      <div>
                        আপনার ডিজিটাল পণ্য / লাইসেন্স কি সফলভাবে আপনার ডেলিভারি ইমেইলে (<strong>{order.customerEmail}</strong>) পাঠানো হয়েছে।
                      </div>
                    </div>
                  </div>
                )}

                {isPending && (
                  <div className={`${styles.statusMessageCard} ${styles.statusMessagePending}`}>
                    <Clock size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: "13px", lineHeight: "1.45" }}>
                      <strong>পেমেন্ট ভেরিফিকেশন প্রক্রিয়াধীন</strong>
                      <div>
                        আপনার সাবমিট করা TrxID ({trxId || "N/A"}) আমাদের সিস্টেমে যাচাই চলছে। অ্যাডমিন অনুমোদনের সাথে সাথে আপনার ইমেইলে লাইসেন্স পৌঁছে যাবে।
                      </div>
                    </div>
                  </div>
                )}

                {isFailed && (
                  <div className={`${styles.statusMessageCard} ${styles.statusMessageFailed}`}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: "13px", lineHeight: "1.45" }}>
                      <strong>পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে</strong>
                      <div>
                        প্রদত্ত TrxID মেলেনি। যদি সঠিক পেমেন্ট করে থাকেন, অনুগ্রহ করে অর্ডার রেফারেন্স উল্লেখ করে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Ordered Products */}
                <div className={styles.sectionTitle}>
                  <Package size={14} />
                  <span>Ordered Products ({order.items.length})</span>
                </div>

                <div className={styles.itemsList}>
                  {order.items.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <div className={styles.itemLeft}>
                        {item.product?.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.productName}
                            width={44}
                            height={44}
                            className={styles.itemThumbnail}
                          />
                        ) : (
                          <div className={styles.itemThumbnail}>
                            <Package size={20} style={{ color: "#94a3b8" }} />
                          </div>
                        )}
                        <div className={styles.itemMeta}>
                          <div className={styles.itemName}>{item.productName}</div>
                          <div>
                            {item.productOptionName && (
                              <span className={styles.itemOption}>
                                {item.productOptionName}
                              </span>
                            )}
                            <span className={styles.itemQty}>
                              Qty: <strong>{item.quantity}</strong> × {formatPrice(item.unitPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.itemPrice} suppressHydrationWarning>
                        {formatPrice(item.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Details Grid: Payment Details & Order Summary */}
                <div className={styles.detailsGrid}>
                  {/* Payment Details */}
                  <div className={styles.detailsBox}>
                    <div className={styles.boxTitle}>
                      <CreditCard size={13} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
                      Payment Information
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Payment Gateway:</span>
                      <span className={styles.kvVal}>{paymentGateway}</span>
                    </div>
                    {trxId && (
                      <div className={styles.kvRow}>
                        <span className={styles.kvKey}>Transaction ID:</span>
                        <button
                          type="button"
                          className={styles.copyCode}
                          onClick={(e) => copyToClipboard(trxId, `trx-${order.id}`, e)}
                          title="Click to copy Transaction ID"
                        >
                          <span>{trxId}</span>
                          {copiedKey === `trx-${order.id}` ? (
                            <Check size={12} style={{ color: "#10b981" }} />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    )}
                    {senderNumber && (
                      <div className={styles.kvRow}>
                        <span className={styles.kvKey}>Sender Number:</span>
                        <span className={styles.kvVal}>{senderNumber}</span>
                      </div>
                    )}
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Payment Status:</span>
                      <span className={styles.kvVal} style={{ color: statusBadge.color }}>
                        {order.payment?.status || order.status}
                      </span>
                    </div>
                  </div>

                  {/* Billing & Customer Details */}
                  <div className={styles.detailsBox}>
                    <div className={styles.boxTitle}>
                      <User size={13} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
                      Order &amp; Delivery Summary
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Delivery Email:</span>
                      <span className={styles.kvVal}>{order.customerEmail || "N/A"}</span>
                    </div>
                    {order.customerPhone && (
                      <div className={styles.kvRow}>
                        <span className={styles.kvKey}>Phone:</span>
                        <span className={styles.kvVal}>{order.customerPhone}</span>
                      </div>
                    )}
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Subtotal:</span>
                      <span className={styles.kvVal} suppressHydrationWarning>{formatPrice(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className={styles.kvRow} style={{ color: "#10b981" }}>
                        <span className={styles.kvKey} style={{ color: "#10b981" }}>
                          Discount{order.couponCode ? ` (${order.couponCode})` : ""}:
                        </span>
                        <span className={styles.kvVal} style={{ color: "#10b981" }} suppressHydrationWarning>
                          -{formatPrice(order.discount)}
                        </span>
                      </div>
                    )}
                    <div className={`${styles.kvRow} ${styles.totalRow}`}>
                      <span className={styles.kvKey} style={{ fontWeight: 700 }}>Total Paid:</span>
                      <span className={styles.totalVal} suppressHydrationWarning>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Action Buttons */}
                <div className={styles.actionFooter}>
                  {isCompleted && (
                    <Link href="/account/licenses" className={styles.actionBtnPrimary}>
                      <KeyRound size={14} />
                      <span>View My Licenses / লাইসেন্স দেখুন</span>
                    </Link>
                  )}
                  <Link
                    href={`/policies/order-and-cancellation`}
                    className={styles.actionBtnSecondary}
                  >
                    <FileText size={14} />
                    <span>Order &amp; Delivery Policy</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

