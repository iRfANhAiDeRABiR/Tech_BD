"use client";

import React, { useState, useEffect, useMemo, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Trash2,
  AlertCircle,
  Headphones,
  FileDown,
} from "lucide-react";
import type { ProductSummary } from "@/types/product";
import { toPlainText } from "@/lib/text";
import { useCart } from "./CartProvider";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";
import { BkashLogo, NagadLogo, RocketLogo } from "@/components/common/PaymentLogos";
import { useCurrency } from "@/context/CurrencyContext";
import type {
  PaymentGatewayOrder,
  SubmittedOrderData,
} from "@/components/payment/PaymentGatewayPage";
import styles from "@/app/cart/cart.module.css";

interface CartPageClientProps {
  products: ProductSummary[];
}

interface AppliedCouponInfo {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  discountAmount: number;
  label?: string;
}

interface CouponFeedback {
  tone: "success" | "error";
  message: string;
}

interface SubmittedOrder {
  id: string;
  orderNumber: string;
  total: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
  senderNumber?: string;
  transactionId?: string;
}

interface CheckoutOrderResponse {
  order?: SubmittedOrder;
  message?: string;
}

type PaymentProviderKey = "bkash" | "nagad" | "rocket";

interface PaymentConfig {
  id: PaymentProviderKey;
  name: string;
  label: string;
  type: string;
  number: string;
  ussd: string;
  accent: string;
  accentBg: string;
  LogoComponent: React.ComponentType<{ className?: string; size?: number }>;
  instructions: {
    app: string[];
    ussd: string[];
  };
}

const PAYMENT_CONFIGS: Record<PaymentProviderKey, PaymentConfig> = {
  bkash: {
    id: "bkash",
    name: "bKash",
    label: "Bkash Send Money",
    type: "Personal Account",
    number: "01641699879",
    ussd: "*247#",
    accent: "#E2136E",
    accentBg: "rgba(226, 19, 110, 0.1)",
    LogoComponent: BkashLogo,
    instructions: {
      app: [
        "Open your bKash App and tap Send Money.",
        "Enter recipient number: 01641699879",
        "Enter the exact payable amount.",
        "Enter your PIN to complete the transfer.",
        "Copy the Transaction ID (TrxID) and enter it below.",
      ],
      ussd: [
        "Dial *247# on your mobile handset.",
        "Select Option 1: Send Money.",
        "Enter receiver number: 01641699879",
        "Enter the exact payable amount.",
        "Enter your bKash PIN to confirm payment.",
        "Enter the TrxID received in SMS below.",
      ],
    },
  },
  nagad: {
    id: "nagad",
    name: "Nagad",
    label: "Nagad Send Money",
    type: "Personal Account",
    number: "01641699879",
    ussd: "*167#",
    accent: "#F6821F",
    accentBg: "rgba(246, 130, 31, 0.1)",
    LogoComponent: NagadLogo,
    instructions: {
      app: [
        "Open your Nagad App and tap Send Money.",
        "Enter recipient number: 01641699879",
        "Enter the exact payable amount.",
        "Enter your Nagad PIN to complete the transfer.",
        "Copy the Transaction ID (TrxID) and enter it below.",
      ],
      ussd: [
        "Dial *167# on your mobile handset.",
        "Select Option 1: Send Money.",
        "Enter receiver number: 01641699879",
        "Enter the exact payable amount.",
        "Enter your Nagad PIN to confirm payment.",
        "Enter the TrxID received in SMS below.",
      ],
    },
  },
  rocket: {
    id: "rocket",
    name: "Rocket",
    label: "Rocket Send Money",
    type: "Personal Account",
    number: "015189028225",
    ussd: "*322#",
    accent: "#8C3494",
    accentBg: "rgba(140, 52, 148, 0.1)",
    LogoComponent: RocketLogo,
    instructions: {
      app: [
        "Open your Rocket App and select Send Money.",
        "Enter recipient number: 015189028225",
        "Enter the exact payable amount.",
        "Enter your Rocket PIN to complete the transfer.",
        "Copy the Transaction ID (TrxID) and enter it below.",
      ],
      ussd: [
        "Dial *322# on your mobile handset.",
        "Select Option 1: Send Money.",
        "Enter receiver number: 015189028225",
        "Enter the exact payable amount.",
        "Enter your Rocket PIN to confirm payment.",
        "Enter the TrxID received in SMS below.",
      ],
    },
  },
};



function isValidBdPhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)]/g, "");
  return /^(?:\+?88)?01[3-9]\d{8}$/.test(clean);
}

function normalizeBdPhone(phone: string): string {
  const clean = phone.replace(/[\s\-\(\)]/g, "");
  if (clean.startsWith("+88")) return clean.slice(3);
  if (clean.startsWith("88")) return clean.slice(2);
  return clean;
}

export function CartPageClient({ products }: CartPageClientProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();

  // Cart state
  const {
    items,
    isHydrated,
    updateQuantity,
    removeItem,
    reconcileCart,
    clearCart,
  } = useCart();

  // Customer Information state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [requirements, setRequirements] = useState("");

  // Payment Selection state
  const [selectedMethod, setSelectedMethod] = useState<PaymentProviderKey>("bkash");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<CouponFeedback | null>(null);

  // Form submission state
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrderData | null>(null);
  const [orderVerificationStatus, setOrderVerificationStatus] = useState<"PENDING" | "CONFIRMED" | "INVALID">("PENDING");

  // Restore submitted order ONLY when URL explicitly has ?order= parameter (e.g. from return button click)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const orderParam = params.get("order");

      if (!orderParam) {
        // Normal visit to /cart or /checkout: show standard shopping cart
        setSubmittedOrder(null);
        localStorage.removeItem("techbd_submitted_order");
        return;
      }

      const stored = sessionStorage.getItem("techbd_submitted_order") || localStorage.getItem("techbd_submitted_order");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.orderNumber === orderParam || parsed.id === orderParam)) {
          setSubmittedOrder(parsed);
          if (parsed.status === "CONFIRMED" || parsed.status === "INVALID" || parsed.status === "PENDING") {
            setOrderVerificationStatus(parsed.status);
          }
          return;
        }
      }

      // If not stored in session or ID differs, initialize placeholder and let live polling fetch
      setSubmittedOrder({
        id: orderParam,
        orderNumber: orderParam,
        total: 0,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        paymentMethod: "Mobile Banking",
      });
    } catch {
      // ignore
    }
  }, []);

  // Live polling for submitted order status
  useEffect(() => {
    const orderNumber = submittedOrder?.orderNumber || submittedOrder?.id;
    if (!orderNumber) return;

    let isCancelled = false;
    let interval: NodeJS.Timeout | null = null;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/order/verify?ref=${encodeURIComponent(orderNumber)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled) return;

        if (data.status) {
          setOrderVerificationStatus(data.status);
          setSubmittedOrder((prev) => ({
            id: data.refId || prev?.id || orderNumber,
            orderNumber: data.orderNumber || prev?.orderNumber || orderNumber,
            total: typeof data.total === "number" ? data.total : (prev?.total ?? 0),
            customerName: data.customerName || prev?.customerName || "",
            customerEmail: data.customerEmail || prev?.customerEmail || "",
            customerPhone: data.customerPhone || prev?.customerPhone || "",
            paymentMethod: data.paymentMethod || prev?.paymentMethod || "Mobile Banking",
            senderNumber: data.senderNumber ?? prev?.senderNumber,
            transactionId: data.transactionId ?? prev?.transactionId,
          }));

          try {
            const current = sessionStorage.getItem("techbd_submitted_order");
            if (current) {
              const updated = { ...JSON.parse(current), status: data.status };
              sessionStorage.setItem("techbd_submitted_order", JSON.stringify(updated));
            }
          } catch {}
        }
      } catch {
        // silent fallback
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 2500);

    return () => {
      isCancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [submittedOrder?.orderNumber, submittedOrder?.id]);

  // Products map
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  // Reconcile cart
  useEffect(() => {
    if (!isHydrated) return;
    reconcileCart((line) => productsById.has(line.productId));
  }, [isHydrated, productsById, reconcileCart]);

  // Auto-populate customer info if authenticated via Supabase
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await (supabase.from("profiles") as any)
            .select("username, phone_e164, whatsapp_e164")
            .eq("id", user.id)
            .single();

          if (profile) {
            setCustomerName((prev) => (prev ? prev : profile.username || ""));
            setCustomerEmail((prev) => (prev ? prev : user.email || ""));
            const phone = String(profile.phone_e164 ?? profile.whatsapp_e164 ?? "");
            setCustomerPhone((prev) => (prev ? prev : phone));
          }
        }
      } catch (err) {
        // Silently continue with empty fields if unauthenticated
      }
    }
    loadUserProfile();
  }, []);

  // Cart products calculations
  const cartProducts = items.flatMap((line) => {
    const product = productsById.get(line.productId);
    if (!product) return [];

    const option = line.optionId
      ? product.options?.find((item) => item.id === line.optionId)
      : undefined;

    const unitPrice = line.unitPrice ?? option?.price ?? product.price;
    const originalPrice =
      line.originalPrice !== undefined
        ? line.originalPrice
        : option?.originalPrice ?? product.originalPrice;
    const optionLabel =
      line.optionName ?? option?.name ?? line.optionType ?? null;

    return [
      {
        line,
        product,
        quantity: line.quantity,
        unitPrice,
        originalPrice,
        optionLabel,
      },
    ];
  });

  const subtotal = cartProducts.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0
  );

  const originalSubtotal = cartProducts.reduce((total, line) => {
    const originalPrice = line.originalPrice ?? line.unitPrice;
    return total + originalPrice * line.quantity;
  }, 0);

  const productSavings = Math.max(0, originalSubtotal - subtotal);

  const couponDiscount = appliedCoupon
    ? appliedCoupon.discountType === "PERCENTAGE"
      ? Math.min(subtotal, Math.round(subtotal * (appliedCoupon.discountValue / 100)))
      : Math.min(subtotal, Math.round(appliedCoupon.discountAmount))
    : 0;

  const total = Math.max(0, subtotal - couponDiscount);
  const totalSavings = productSavings + couponDiscount;

  const currentPayment = PAYMENT_CONFIGS[selectedMethod];

  // Auto-apply pending coupon from promo banner if present
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("techbd_pending_coupon");
      if (pending && !appliedCoupon && subtotal > 0) {
        const clean = pending.trim().toUpperCase();
        setCouponInput(clean);
        fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: clean, subtotal }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.valid) {
              setAppliedCoupon({
                code: data.code,
                discountType: data.discountType || "PERCENTAGE",
                discountValue: data.discountValue || 10,
                discountAmount: data.discountAmount || Math.round(subtotal * 0.1),
                label: data.label,
              });
              setCouponFeedback({
                tone: "success",
                message: `🎉 Promo ${data.code} auto-applied! 10% discount added.`,
              });
              sessionStorage.removeItem("techbd_pending_coupon");
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, [subtotal, appliedCoupon]);

  // Coupon handlers
  const handleApplyCoupon = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();

    if (!cleanCode) {
      setCouponFeedback({ tone: "error", message: "Please enter a coupon code." });
      return;
    }

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode, subtotal }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountType: data.discountType || "PERCENTAGE",
          discountValue: data.discountValue || 10,
          discountAmount: data.discountAmount || Math.round(subtotal * 0.1),
          label: data.label,
        });
        setCouponFeedback({
          tone: "success",
          message: data.message || `${cleanCode} applied! Discount added.`,
        });
        notify.success("Coupon applied", {
          description: `${cleanCode} applied to your order.`,
          id: "coupon-ok",
        });
      } else {
        setAppliedCoupon(null);
        setCouponFeedback({
          tone: "error",
          message: data.message || "Invalid or inactive coupon code.",
        });
        notify.error("Invalid coupon", {
          description: data.message || "That coupon code is not recognized or is inactive.",
          id: "coupon-err",
        });
      }
    } catch {
      // Offline fallback
      if (cleanCode === "TECHBD10" || cleanCode === "SAVE10" || cleanCode === "SAFE10") {
        const discountAmount = Math.round(subtotal * 0.1);
        setAppliedCoupon({
          code: cleanCode,
          discountType: "PERCENTAGE",
          discountValue: 10,
          discountAmount,
          label: "10% off storewide",
        });
        setCouponFeedback({
          tone: "success",
          message: `${cleanCode} applied! 10% discount added.`,
        });
        notify.success("Coupon applied", {
          description: `${cleanCode} gave you 10% discount on your order.`,
          id: "coupon-ok",
        });
      } else {
        setAppliedCoupon(null);
        setCouponFeedback({
          tone: "error",
          message: "Invalid or expired coupon code.",
        });
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponFeedback(null);
    notify.info("Coupon removed", { id: "coupon-rm" });
  };

  // Form Validation (Customer Info only for initial order submission)
  const validateCustomerForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.name = "Full name is required (minimum 2 characters).";
    }

    if (!customerPhone.trim() || !isValidBdPhone(customerPhone)) {
      errors.phone = "Enter a valid Bangladesh mobile number (e.g., 01XXXXXXXXX).";
    }

    if (
      !customerEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
    ) {
      errors.email = "Valid delivery email address is required for software activation.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Order Placement -> Transitions to dedicated Payment Gateway page
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCustomerForm()) {
      notify.warning("Required fields missing", {
        description: "Please enter your full name, mobile number, and delivery email address.",
        id: "checkout-val-err",
      });
      return;
    }

    const orderRef = `TECHBD-ATD-${Math.floor(100000 + Math.random() * 900000)}`;

    const pendingPaymentOrder: PaymentGatewayOrder = {
      refId: orderRef,
      customerName: customerName.trim(),
      customerPhone: normalizeBdPhone(customerPhone.trim()),
      customerEmail: customerEmail.trim(),
      total,
      totalPrice: formatPrice(total),
      paymentMethod: selectedMethod,
      notes: requirements.trim() || null,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      items: cartProducts.map(({ line, product, quantity, unitPrice, originalPrice, optionLabel }) => ({
        productId: product.id,
        optionId: line.optionId,
        optionName: optionLabel ?? undefined,
        optionType: line.optionType,
        productName: toPlainText(product.name),
        productImage: product.image,
        unitPrice,
        originalUnitPrice: originalPrice ?? null,
        quantity,
      })),
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("techbd_pending_payment", JSON.stringify(pendingPaymentOrder));
    }

    router.push("/checkout/payment");
  };

  // ── 1. Order Placed / Verification Status View ─────────────────────────
  if (submittedOrder) {
    const isConfirmed = orderVerificationStatus === "CONFIRMED";
    const isInvalid = orderVerificationStatus === "INVALID";
    const isPending = orderVerificationStatus === "PENDING";

    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.confirmationCard}>
            {/* Dynamic Status Icon */}
            <div
              className={styles.successCheckWrap}
              style={{
                background: isConfirmed
                  ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                  : isInvalid
                  ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                  : "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              }}
              aria-hidden="true"
            >
              {isConfirmed ? "✓" : isInvalid ? "✕" : "⏳"}
            </div>

            {/* Dynamic Title */}
            <h1 className={styles.confirmationTitle}>
              {isConfirmed && "Payment Verified & Order Confirmed!"}
              {isInvalid && "TrxID Verification Failed!"}
              {isPending && "Order Placed — Verification In Progress"}
            </h1>

            {/* Dynamic Status Pill */}
            <div
              className={styles.confirmationBadge}
              style={{
                background: isConfirmed
                  ? "rgba(16, 185, 129, 0.12)"
                  : isInvalid
                  ? "rgba(239, 68, 68, 0.12)"
                  : "rgba(245, 158, 11, 0.12)",
                borderColor: isConfirmed
                  ? "rgba(16, 185, 129, 0.4)"
                  : isInvalid
                  ? "rgba(239, 68, 68, 0.4)"
                  : "rgba(245, 158, 11, 0.4)",
                color: isConfirmed ? "#10B981" : isInvalid ? "#EF4444" : "#F59E0B",
              }}
            >
              <span aria-hidden="true">
                {isConfirmed ? "✅" : isInvalid ? "❌" : "⏳"}
              </span>
              <span>
                {isConfirmed && "Payment Verified & Confirmed (অনুমোদিত)"}
                {isInvalid && "ভুল TrxID (Verification Failed - বাতিল)"}
                {isPending && "Payment Submitted — Pending Verification (ভেরিফিকেশন চলছে)"}
              </span>
            </div>

            {/* Subtitle Description */}
            <p className={styles.subtitle} style={{ marginBottom: "24px" }}>
              {isConfirmed &&
                `আপনার পেমেন্ট সফলভাবে অনুমোদিত হয়েছে। কিছুক্ষণের মধ্যে আপনার ইমেইলে (${submittedOrder.customerEmail}) লাইসেন্স কি ও সেটআপ নির্দেশনা পৌঁছে যাবে।`}
              {isInvalid &&
                `আপনার প্রদত্ত Transaction ID (${submittedOrder.transactionId}) যাচাই করা সম্ভব হয়নি। অনুগ্রহ করে নিচের বাটনে ক্লিক করে পেমেন্ট গেটওয়েতে সঠিক TrxID লিখুন।`}
              {isPending &&
                "আপনার পেমেন্ট তথ্য সফলভাবে গ্রহণ করা হয়েছে এবং ভেরিফিকেশন চলছে। অ্যাডমিন কনফার্ম করা মাত্রই এই স্ক্রিন স্বয়ংক্রিয়ভাবে আপডেট হবে।"}
            </p>

            {/* If Invalid, direct button to return to Payment Gateway */}
            {isInvalid && (
              <div style={{ marginBottom: "24px" }}>
                <Link
                  href="/checkout/payment"
                  className={styles.submitOrderButton}
                  style={{
                    background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                    maxWidth: "340px",
                    margin: "0 auto",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    textDecoration: "none",
                  }}
                >
                  🔄 পুনরায় TrxID দিন (Re-enter TrxID in Gateway)
                </Link>
              </div>
            )}

            {/* Complete Order Details Grid */}
            <div className={styles.orderDetailsGrid}>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Order Reference</span>
                <span className={styles.orderDetailValue}>#{submittedOrder.orderNumber || submittedOrder.id}</span>
              </div>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Verification Status</span>
                <span
                  className={styles.orderDetailValue}
                  style={{
                    color: isConfirmed ? "#10B981" : isInvalid ? "#EF4444" : "#F59E0B",
                    fontWeight: 750,
                  }}
                >
                  {isConfirmed && "✅ Confirmed (অনুমোদিত)"}
                  {isInvalid && "❌ Verification Failed (ভুল TrxID)"}
                  {isPending && "⏳ Pending Verification (চলছে)"}
                </span>
              </div>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Total Amount</span>
                <span className={styles.orderDetailValue} style={{ color: "var(--accent-secondary, #00D4AA)", fontWeight: 800 }}>
                  {formatPrice(submittedOrder.total)}
                </span>
              </div>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Delivery Email</span>
                <span className={styles.orderDetailValue}>{submittedOrder.customerEmail}</span>
              </div>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Customer Name</span>
                <span className={styles.orderDetailValue}>{submittedOrder.customerName || "N/A"}</span>
              </div>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Customer Phone</span>
                <span className={styles.orderDetailValue}>{submittedOrder.customerPhone || "N/A"}</span>
              </div>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Payment Method</span>
                <span className={styles.orderDetailValue}>{submittedOrder.paymentMethod || "Mobile Banking"}</span>
              </div>
              {submittedOrder.senderNumber && (
                <div className={styles.orderDetailItem}>
                  <span className={styles.orderDetailLabel}>Sender Number</span>
                  <span className={styles.orderDetailValue} style={{ fontFamily: "var(--font-mono, monospace)" }}>
                    {submittedOrder.senderNumber}
                  </span>
                </div>
              )}
              {submittedOrder.transactionId && (
                <div className={styles.orderDetailItem}>
                  <span className={styles.orderDetailLabel}>Transaction ID (TrxID)</span>
                  <span
                    className={styles.orderDetailValue}
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 750,
                      color: isInvalid ? "#EF4444" : "#10B981",
                    }}
                  >
                    {submittedOrder.transactionId}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className={styles.confirmationActions}>
              {isConfirmed && (
                <a
                  href={`/api/orders/${encodeURIComponent(submittedOrder.orderNumber)}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.continueButton}
                  style={{
                    background: "#0f172a",
                    color: "#38bdf8",
                    borderColor: "rgba(56, 189, 248, 0.4)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                  title="Download official PDF tax invoice with full details"
                >
                  <FileDown size={16} />
                  <span>Download Invoice (PDF)</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem("techbd_submitted_order");
                    localStorage.removeItem("techbd_submitted_order");
                    sessionStorage.removeItem("techbd_pending_payment");
                  } catch {}
                  setSubmittedOrder(null);
                  if (typeof window !== "undefined") {
                    window.history.replaceState({}, "", "/cart");
                  }
                }}
                className={styles.continueButton}
                style={{ cursor: "pointer", background: "#2563eb", color: "#ffffff", border: "none" }}
              >
                🛒 Go to Cart
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem("techbd_submitted_order");
                    localStorage.removeItem("techbd_submitted_order");
                    sessionStorage.removeItem("techbd_pending_payment");
                  } catch {}
                  setSubmittedOrder(null);
                  if (typeof window !== "undefined") {
                    window.history.replaceState({}, "", window.location.pathname);
                  }
                }}
                className={styles.continueButton}
                style={{ cursor: "pointer", background: "none", border: "1px solid rgba(255, 255, 255, 0.15)" }}
              >
                + Start New Order
              </button>
              <Link href="/products#products-by-category" className={styles.continueButton}>
                ← Browse Catalog
              </Link>
              <Link href="/account/orders" className={styles.continueButton}>
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── 2. Empty Cart View ─────────────────────────────────────────────────
  if (cartProducts.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              🛒
            </span>
            <h1 className={styles.emptyTitle}>Your cart is empty</h1>
            <p className={styles.emptySubtitle}>
              You have not selected any digital software products yet. Browse our marketplace for genuine operating systems, office packages, CAD tools, and security suites.
            </p>
            <Link href="/products#products-by-category" className={styles.emptyButton}>
              <ShoppingBag size={18} />
              <span>Browse Software Catalog →</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── 3. Active Two-Column Checkout View ──────────────────────────────────
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Checkout Header */}
        <div className={styles.header}>
          <span className={styles.headerBadge}>Secure Digital Checkout</span>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Checkout</span>
          </h1>
          <p className={styles.subtitle}>
            Complete your customer details and mobile banking payment to receive genuine software licenses.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className={styles.checkoutLayout}>
          {/* ===============================================================
              LEFT COLUMN (60%): CUSTOMER INFO & PAYMENT FORM
             =============================================================== */}
          <form id="checkout-form" className={styles.leftColumn} onSubmit={handlePlaceOrder} noValidate>
            {/* Step 1: Customer Information */}
            <section className={styles.sectionCard} aria-labelledby="customer-info-title">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>1</span>
                <div className={styles.sectionTitleGroup}>
                  <h2 id="customer-info-title" className={styles.sectionTitle}>
                    Customer Information
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Provide your contact details where your digital licenses and invoices will be delivered.
                  </p>
                </div>
              </div>

              <div className={styles.formGrid}>
                {/* Full Name */}
                <div className={styles.formGroup}>
                  <label htmlFor="customer-name" className={styles.formLabel}>
                    <span>Full Name <span className={styles.formRequired}>*</span></span>
                  </label>
                  <input
                    id="customer-name"
                    name="name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: "" }));
                      }
                    }}
                    placeholder=""
                    autoComplete="name"
                    className={`${styles.formInput} ${fieldErrors.name ? styles.formInputError : ""}`}
                  />
                  {fieldErrors.name && (
                    <p className={styles.formErrorText}>{fieldErrors.name}</p>
                  )}
                </div>

                <div className={styles.formGridTwoCol}>
                  {/* Phone Number */}
                  <div className={styles.formGroup}>
                    <label htmlFor="customer-phone" className={styles.formLabel}>
                      <span>Phone Number <span className={styles.formRequired}>*</span></span>
                    </label>
                    <input
                      id="customer-phone"
                      name="phone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (fieldErrors.phone) {
                          setFieldErrors((prev) => ({ ...prev, phone: "" }));
                        }
                      }}
                      placeholder="01XXXXXXXXX"
                      autoComplete="tel"
                      className={`${styles.formInput} ${fieldErrors.phone ? styles.formInputError : ""}`}
                    />
                    {fieldErrors.phone ? (
                      <p className={styles.formErrorText}>{fieldErrors.phone}</p>
                    ) : (
                      <p className={styles.formHelpText}>Used for order delivery & verification alerts</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className={styles.formGroup}>
                    <label htmlFor="customer-email" className={styles.formLabel}>
                      <span>Delivery Email Address <span className={styles.formRequired}>*</span></span>
                    </label>
                    <input
                      id="customer-email"
                      name="email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => {
                        setCustomerEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: "" }));
                        }
                      }}
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      className={`${styles.formInput} ${fieldErrors.email ? styles.formInputError : ""}`}
                    />
                    {fieldErrors.email ? (
                      <p className={styles.formErrorText}>{fieldErrors.email}</p>
                    ) : (
                      <p className={styles.formHelpText}>Official license keys & setup guide will be sent here</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Method Selection */}
            <section className={styles.sectionCard} aria-labelledby="payment-method-title">
              <div className={styles.sectionHeader} style={{ marginBottom: "14px" }}>
                <div className={styles.sectionTitleGroup}>
                  <label id="payment-method-title" className={styles.formLabel} style={{ fontSize: "12px", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 0 }}>
                    <span>PAYMENT METHOD <span className={styles.formRequired}>*</span></span>
                  </label>
                </div>
              </div>

              {/* 3 Selectable Payment Cards: Bkash | Nagad | Rocket (Screenshot 1) */}
              <div className={styles.paymentCardsGrid} role="radiogroup" aria-label="Select Payment Method">
                {(Object.keys(PAYMENT_CONFIGS) as PaymentProviderKey[]).map((key) => {
                  const cfg = PAYMENT_CONFIGS[key];
                  const isSelected = selectedMethod === key;
                  const Logo = cfg.LogoComponent;

                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`${styles.paymentCard} ${isSelected ? styles.paymentCardSelected : ""}`}
                      onClick={() => setSelectedMethod(key)}
                    >
                      <div className={styles.paymentCardLogoWrap}>
                        <Logo className="w-6 h-6" size={24} />
                      </div>
                      <span className={styles.paymentCardName}>{cfg.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Single Helper Line under Payment Options (Screenshot 1) */}
              <div className={styles.paymentHintBar}>
                <span>
                  {selectedMethod === "bkash" && "Send Money / Payment via bKash App or dial *247#"}
                  {selectedMethod === "nagad" && "Send Money via Nagad App or dial *167#"}
                  {selectedMethod === "rocket" && "Send Money via Rocket App or dial *322#"}
                </span>
                <span className={styles.paymentHintBrand}>
                  {currentPayment.name}
                </span>
              </div>

              {/* Additional Requirements (Optional) */}
              <div className={styles.formGroup}>
                <label htmlFor="order-requirements" className={styles.formLabel}>
                  <span>Additional Requirements (Optional)</span>
                </label>
                <textarea
                  id="order-requirements"
                  name="requirements"
                  rows={2}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g. Need assistance with multi-seat setup or version compatibility..."
                  className={styles.formTextarea}
                />
              </div>
            </section>

            {/* Trust and Guarantee Badges */}
            <div className={styles.trustBadgesRow}>
              <div className={styles.trustBadgeItem}>
                <ShieldCheck className={styles.trustBadgeIcon} style={{ color: "#10B981" }} />
                <div>
                  <h4 className={styles.trustBadgeTitle}>Genuine Software</h4>
                  <p className={styles.trustBadgeDesc}>100% Authentic Licenses</p>
                </div>
              </div>
              <div className={styles.trustBadgeItem}>
                <Zap className={styles.trustBadgeIcon} style={{ color: "#F59E0B" }} />
                <div>
                  <h4 className={styles.trustBadgeTitle}>Fast Delivery</h4>
                  <p className={styles.trustBadgeDesc}>Sent directly to your delivery email</p>
                </div>
              </div>
              <div className={styles.trustBadgeItem}>
                <Headphones className={styles.trustBadgeIcon} style={{ color: "#6C63FF" }} />
                <div>
                  <h4 className={styles.trustBadgeTitle}>Live Support</h4>
                  <p className={styles.trustBadgeDesc}>24/7 Dedicated Assistance</p>
                </div>
              </div>
            </div>
          </form>

          {/* ===============================================================
              RIGHT COLUMN (40%): COMPLETE PRODUCT DETAILS & ORDER SUMMARY
             =============================================================== */}
          <aside className={styles.rightColumn} aria-label="Order Summary">
            <div className={styles.orderSummaryCard}>
              <h2 className={styles.orderSummaryTitle}>Your Order</h2>
              <p className={styles.orderSummarySubtitle}>
                Review your products before placing your order.
              </p>

              {/* Product List */}
              <div className={styles.productList} role="list">
                {cartProducts.map(({ line, product, quantity, unitPrice, originalPrice, optionLabel }) => {
                  const name = toPlainText(product.name);
                  const hasDiscount = originalPrice !== null && originalPrice > unitPrice;

                  return (
                    <div
                      key={`${product.id}:${line.optionId ?? "base"}`}
                      className={styles.productRow}
                      role="listitem"
                    >
                      {/* Product Thumbnail */}
                      <div className={styles.productThumbnail}>
                        <Image
                          src={product.image}
                          alt={name}
                          width={75}
                          height={75}
                          className="object-contain"
                        />
                      </div>

                      {/* Product Info */}
                      <div className={styles.productInfo}>
                        <Link href={`/products/${product.id}`} className={styles.productName}>
                          {name}
                        </Link>

                        {optionLabel && (
                          <span className={styles.productOptionBadge}>
                            {optionLabel}
                          </span>
                        )}

                        {/* Quantity controls */}
                        <div className={styles.productQuantityControls}>
                          <button
                            type="button"
                            className={styles.qtyButton}
                            disabled={quantity <= 1}
                            onClick={() => updateQuantity(product.id, quantity - 1, line.optionId)}
                            aria-label={`Decrease quantity of ${name}`}
                          >
                            −
                          </button>
                          <span className={styles.qtyValue}>{quantity}</span>
                          <button
                            type="button"
                            className={styles.qtyButton}
                            disabled={quantity >= 99}
                            onClick={() => updateQuantity(product.id, quantity + 1, line.optionId)}
                            aria-label={`Increase quantity of ${name}`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className={styles.productRemoveBtn}
                            onClick={() => removeItem(product.id, line.optionId)}
                            aria-label={`Remove ${name} from order`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Price Column */}
                      <div className={styles.productPriceCol}>
                        <span className={styles.productLineTotal}>
                          {formatPrice(unitPrice * quantity)}
                        </span>
                        {hasDiscount && (
                          <span className={styles.productOriginalPrice}>
                            {formatPrice(originalPrice! * quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Section */}
              <div className={styles.couponSection}>
                <label htmlFor="coupon-input" className={styles.couponLabel}>
                  Have a coupon code?
                </label>

                {appliedCoupon ? (
                  <div className={styles.couponAppliedBadge}>
                    <span className={styles.couponAppliedText}>
                      <span>✓ {appliedCoupon.code} ({appliedCoupon.label || (appliedCoupon.discountType === "PERCENTAGE" ? `${appliedCoupon.discountValue}% off` : `৳${appliedCoupon.discountValue} off`)})</span>
                    </span>
                    <button
                      type="button"
                      className={styles.couponRemoveBtn}
                      onClick={handleRemoveCoupon}
                      aria-label="Remove applied coupon"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form className={styles.couponForm} onSubmit={handleApplyCoupon}>
                    <input
                      id="coupon-input"
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponFeedback?.tone === "error") {
                          setCouponFeedback(null);
                        }
                      }}
                      placeholder=""
                      className={styles.couponInput}
                    />
                    <button
                      type="submit"
                      disabled={!couponInput.trim()}
                      className={styles.couponApplyBtn}
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponFeedback && (
                  <p
                    className={
                      couponFeedback.tone === "success"
                        ? styles.couponAppliedBadge
                        : styles.couponError
                    }
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Order Total Breakdown */}
              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>Products Subtotal</span>
                  <span className={styles.priceRowValue}>{formatPrice(subtotal)}</span>
                </div>

                {productSavings > 0 && (
                  <div className={styles.priceRow}>
                    <span>Product Discounts</span>
                    <span className={`${styles.priceRowValue} ${styles.priceRowSavings}`}>
                      −{formatPrice(productSavings)}
                    </span>
                  </div>
                )}

                {couponDiscount > 0 && appliedCoupon && (
                  <div className={styles.priceRow}>
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className={`${styles.priceRowValue} ${styles.priceRowSavings}`}>
                      −{formatPrice(couponDiscount)}
                    </span>
                  </div>
                )}

                <div className={styles.priceRow}>
                  <span>Digital Delivery</span>
                  <span className={styles.deliveryFree}>Free (Instant)</span>
                </div>

                {totalSavings > 0 && (
                  <div className={styles.priceRow}>
                    <span>Total Savings</span>
                    <span className={`${styles.priceRowValue} ${styles.priceRowSavings}`}>
                      −{formatPrice(totalSavings)}
                    </span>
                  </div>
                )}

                <div className={styles.divider} />

                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>TOTAL PAYABLE</span>
                  <span className={styles.totalAmount}>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Submit Order Blue Button on the Right Side */}
              <div style={{ marginTop: "18px", marginBottom: "16px" }}>
                <button
                  type="submit"
                  form="checkout-form"
                  onClick={handlePlaceOrder}
                  className={styles.submitOrderButton}
                >
                  <span>Submit Order →</span>
                </button>
              </div>

              {/* Guarantee Notes */}
              <div className={styles.guaranteeNotes}>
                <div className={styles.guaranteeItem}>
                  <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                  <span>Official Genuine License Guarantee</span>
                </div>
                <div className={styles.guaranteeItem}>
                  <Zap size={14} style={{ color: "#F59E0B" }} />
                  <span>Immediate License Dispatch After Verification</span>
                </div>
                <div className={styles.guaranteeItem}>
                  <Headphones size={14} style={{ color: "#6C63FF" }} />
                  <span>Dedicated Support Available 24/7</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
