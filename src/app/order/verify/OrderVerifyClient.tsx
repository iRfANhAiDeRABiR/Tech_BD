"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileDown,
  Download,
  MessageCircle,
  Search,
  ExternalLink,
} from "lucide-react";
import styles from "./OrderVerify.module.css";

interface OrderVerifyClientProps {
  initialRef: string;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone: string;
    customerWhatsApp?: string | null;
    subtotal: number;
    discount: number;
    total: number;
    status: string;
    createdAt: string;
    payment?: {
      method?: string | null;
      transactionId?: string | null;
      senderNumber?: string | null;
      status?: string | null;
      verifiedAt?: string | null;
    } | null;
    items: Array<{
      id: string;
      productName: string;
      productOptionName?: string | null;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  } | null;
}

export function OrderVerifyClient({ initialRef, order }: OrderVerifyClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialRef);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim().replace(/^#+/, "").replace(/^INV-/, "");
    if (clean) {
      router.push(`/order/verify?ref=${encodeURIComponent(clean)}`);
    }
  };

  const isConfirmed =
    order &&
    (order.status === "COMPLETED" ||
      order.status === "PAID" ||
      order.payment?.status === "VERIFIED");

  const isInvalid =
    order &&
    (order.status === "CANCELLED" ||
      order.status === "REFUNDED" ||
      order.payment?.status === "REJECTED");

  const isPending = order && !isConfirmed && !isInvalid;

  const formatPrice = (amount: number) => {
    return `BDT ${amount.toLocaleString("en-US")}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? "N/A"
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const formatPaymentGateway = (m?: string | null) => {
    if (!m) return "Mobile Banking";
    const u = m.toUpperCase();
    if (u === "BKASH") return "bKash";
    if (u === "NAGAD") return "Nagad";
    if (u === "ROCKET") return "Rocket";
    if (u === "UPAY") return "Upay";
    if (u === "BANK_TRANSFER") return "Bank Transfer";
    return m;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Brand Header */}
        <header className={styles.brandHeader}>
          <div className={styles.brandBadge}>
            <ShieldCheck size={14} />
            <span>Official Authenticity Verification</span>
          </div>
          <h1 className={styles.pageTitle}>Invoice &amp; Order Verification</h1>
          <p className={styles.pageSubtitle}>
            Tech Solutions BD — Verify genuine software licensing, payment verification, and official invoice records in real-time.
          </p>
        </header>

        {/* Verification Result Card */}
        {order ? (
          <div className={styles.verificationCard}>
            {/* Status Header */}
            <div className={styles.statusHeader}>
              <div
                className={`${styles.statusIconWrap} ${
                  isConfirmed
                    ? styles.statusIconConfirmed
                    : isInvalid
                    ? styles.statusIconInvalid
                    : styles.statusIconPending
                }`}
              >
                {isConfirmed ? (
                  <CheckCircle2 size={28} />
                ) : isInvalid ? (
                  <AlertTriangle size={28} />
                ) : (
                  <Clock size={28} />
                )}
              </div>

              <div>
                <h2 className={styles.statusTitle}>
                  {isConfirmed && "Official Invoice Authenticated & Confirmed"}
                  {isInvalid && "Order Verification Status: Cancelled or Rejected"}
                  {isPending && "Payment Submitted — Verification In Progress"}
                </h2>
                <p className={styles.statusDesc}>
                  {isConfirmed &&
                    "This invoice and order have been fully authenticated in the Tech Solutions BD system. The software licenses issued under this order are 100% genuine."}
                  {isInvalid &&
                    "The transaction or order reference could not be verified. If you need assistance, please contact our support helpline below."}
                  {isPending &&
                    "Payment has been submitted and is currently being verified by our finance team. Once approved, official invoice and license delivery will complete."}
                </p>
              </div>
            </div>

            {/* Order Metadata Grid */}
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Order Reference</div>
                <div className={`${styles.detailValue} ${styles.monoVal}`}>
                  #{order.orderNumber}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Invoice Reference</div>
                <div className={`${styles.detailValue} ${styles.monoVal}`}>
                  INV-{order.orderNumber}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Customer Name</div>
                <div className={styles.detailValue}>{order.customerName}</div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Delivery Contact</div>
                <div className={styles.detailValue}>
                  {order.customerEmail || order.customerPhone}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Payment Method</div>
                <div className={styles.detailValue}>
                  {formatPaymentGateway(order.payment?.method)}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Transaction ID (TrxID)</div>
                <div className={`${styles.detailValue} ${styles.monoVal}`}>
                  {order.payment?.transactionId || "Confirmed"}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Order Date &amp; Time</div>
                <div className={styles.detailValue}>{formatDate(order.createdAt)}</div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Total Paid (BDT)</div>
                <div className={styles.detailValue} style={{ color: "#10b981" }}>
                  {formatPrice(order.total)}
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            {order.items && order.items.length > 0 && (
              <div className={styles.itemsSection}>
                <div className={styles.itemsHeading}>
                  <span>Licensed Software Items ({order.items.length})</span>
                </div>
                {order.items.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.productName}</span>
                      {item.productOptionName && (
                        <span className={styles.itemOption}>
                          Edition: {item.productOptionName} (Qty: {item.quantity})
                        </span>
                      )}
                    </div>
                    <span className={styles.itemPrice}>
                      {formatPrice(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.actionsRow}>
              {isConfirmed && (
                <a
                  href={`/api/orders/${order.id}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnPrimary}
                  title="Download official PDF invoice"
                >
                  <FileDown size={18} />
                  <span>Download Official Invoice (PDF)</span>
                </a>
              )}

              <Link href="/downloads" className={styles.btnSecondary}>
                <Download size={16} />
                <span>Software Download Center</span>
              </Link>
            </div>

            {/* WhatsApp Helpline */}
            <a
              href={`https://wa.me/8809697399879?text=${encodeURIComponent(
                `Hello Tech Solutions BD, I am verifying Order #${order.orderNumber}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnWhatsApp}
            >
              <MessageCircle size={18} />
              <span>Contact Official WhatsApp Support (+880 9697-399879)</span>
            </a>
          </div>
        ) : (
          <div className={styles.verificationCard} style={{ textAlign: "center" }}>
            <div
              className={`${styles.statusIconWrap} ${styles.statusIconPending}`}
              style={{ margin: "0 auto 16px" }}
            >
              <Search size={26} />
            </div>
            <h2 className={styles.statusTitle}>
              {initialRef ? "Order Reference Not Found" : "Verify Invoice Authenticity"}
            </h2>
            <p className={styles.statusDesc}>
              {initialRef
                ? `Could not locate order reference "${initialRef}". Please check the order number or TrxID on your invoice and try again.`
                : "Enter your official Order Number (e.g. TSBD-...) or TrxID to check authentication status and download your invoice."}
            </p>
          </div>
        )}

        {/* Search Another Order Bar */}
        <div className={styles.searchCard}>
          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
            🔍 Verify Another Order or Invoice
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary, #94a3b8)", margin: 0 }}>
            Enter any Order Reference Number (e.g. TSBD-20261024-XXXX) to verify genuine licensing.
          </p>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. TSBD-20261024-VLXAO4"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn}>
              Verify Now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

