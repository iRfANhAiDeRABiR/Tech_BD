"use client";

import React, { useState, useEffect, useMemo, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Zap,
  MessageCircle,
  ShoppingBag,
  Trash2,
  AlertCircle,
  ArrowRight,
  Headphones,
} from "lucide-react";
import type { ProductSummary } from "@/types/product";
import { toPlainText } from "@/lib/text";
import { useCart } from "./CartProvider";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";
import { BkashLogo, NagadLogo, RocketLogo } from "@/components/common/PaymentLogos";
import PaymentGatewayPage, {
  type PaymentGatewayOrder,
  type SubmittedOrderData,
} from "@/components/payment/PaymentGatewayPage";
import styles from "@/app/cart/cart.module.css";

interface CartPageClientProps {
  products: ProductSummary[];
}

const COUPONS = {
  TECHBD10: { rate: 0.1, label: "10% off" },
  SAVE10: { rate: 0.1, label: "10% off" },
  SAFE10: { rate: 0.1, label: "10% off" },
} as const;

type CouponCode = keyof typeof COUPONS;

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

function isCouponCode(value: string): value is CouponCode {
  return Object.prototype.hasOwnProperty.call(COUPONS, value);
}

function formatPrice(value: number): string {
  return `৳${Math.max(0, Math.round(value)).toLocaleString("en-BD")}`;
}

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

  // Payment Selection & Verification state
  const [selectedMethod, setSelectedMethod] = useState<PaymentProviderKey>("bkash");
  const [activePaymentOrder, setActivePaymentOrder] = useState<PaymentGatewayOrder | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<CouponFeedback | null>(null);

  // Form submission state
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrderData | null>(null);

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
    ? Math.min(subtotal, Math.round(subtotal * COUPONS[appliedCoupon].rate))
    : 0;

  const total = Math.max(0, subtotal - couponDiscount);
  const totalSavings = productSavings + couponDiscount;

  const currentPayment = PAYMENT_CONFIGS[selectedMethod];

  // Coupon handlers
  const handleApplyCoupon = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();

    if (!cleanCode) {
      setCouponFeedback({ tone: "error", message: "Please enter a coupon code." });
      return;
    }

    if (!isCouponCode(cleanCode)) {
      setAppliedCoupon(null);
      setCouponFeedback({
        tone: "error",
        message: "Invalid or expired coupon code.",
      });
      notify.error("Invalid coupon", {
        description: "That coupon code is not recognized.",
        id: "coupon-err",
      });
      return;
    }

    setAppliedCoupon(cleanCode);
    setCouponFeedback({
      tone: "success",
      message: `${cleanCode} applied! 10% discount added.`,
    });
    notify.success("Coupon applied", {
      description: `${cleanCode} gave you 10% discount on your order.`,
      id: "coupon-ok",
    });
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

    setActivePaymentOrder({
      refId: orderRef,
      customerName: customerName.trim(),
      customerPhone: normalizeBdPhone(customerPhone.trim()),
      customerEmail: customerEmail.trim(),
      total,
      totalPrice: formatPrice(total),
      paymentMethod: selectedMethod,
      notes: requirements.trim() || null,
      couponCode: appliedCoupon || null,
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
    });
  };

  // WhatsApp Order Confirmation URL
  const buildWhatsAppUrl = () => {
    if (!submittedOrder) return "https://wa.me/8801641699879";
    const msg = [
      "🛒 *New Order Confirmation - Tech Solutions BD*",
      `🆔 *Order ID:* #${submittedOrder.orderNumber}`,
      `👤 *Name:* ${submittedOrder.customerName}`,
      `📱 *Phone:* ${submittedOrder.customerPhone}`,
      `📧 *Email:* ${submittedOrder.customerEmail}`,
      "",
      `💳 *Payment Method:* ${submittedOrder.paymentMethod}`,
      `📱 *Sender Number:* ${submittedOrder.senderNumber}`,
      `🔖 *TrxID:* ${submittedOrder.transactionId}`,
      `💰 *Total Paid:* ${formatPrice(submittedOrder.total)}`,
      "",
      "Please verify my payment and deliver my software license keys. Thank you!",
    ].join("\n");

    return `https://wa.me/8801641699879?text=${encodeURIComponent(msg)}`;
  };

  // ── 0. Dedicated Payment Gateway Screen per Payment Option ─────────────
  if (activePaymentOrder) {
    return (
      <PaymentGatewayPage
        order={activePaymentOrder}
        onCancel={() => setActivePaymentOrder(null)}
        onSuccess={(confirmed) => {
          clearCart();
          setActivePaymentOrder(null);
          setSubmittedOrder(confirmed);
        }}
      />
    );
  }

  // ── 1. Order Placed Confirmation View ──────────────────────────────────
  if (submittedOrder) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.confirmationCard}>
            <div className={styles.successCheckWrap} aria-hidden="true">
              ✓
            </div>

            <h1 className={styles.confirmationTitle}>Order Placed Successfully!</h1>

            <div className={styles.confirmationBadge}>
              <span aria-hidden="true">⏳</span>
              <span>Payment Submitted — Pending Manual Verification</span>
            </div>

            <p className={styles.subtitle} style={{ marginBottom: "24px" }}>
              Thank you for ordering with Tech Solutions BD. We have received your payment submission and our team is verifying your Transaction ID.
            </p>

            <div className={styles.orderDetailsGrid}>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Order Reference</span>
                <span className={styles.orderDetailValue}>#{submittedOrder.orderNumber}</span>
              </div>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Total Amount</span>
                <span className={styles.orderDetailValue} style={{ color: "var(--accent-secondary, #00D4AA)" }}>
                  {formatPrice(submittedOrder.total)}
                </span>
              </div>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Delivery Email</span>
                <span className={styles.orderDetailValue}>{submittedOrder.customerEmail}</span>
              </div>
              <div className={styles.orderDetailItem}>
                <span className={styles.orderDetailLabel}>Payment via</span>
                <span className={styles.orderDetailValue}>
                  {submittedOrder.paymentMethod} (TrxID: {submittedOrder.transactionId})
                </span>
              </div>
            </div>

            {/* Instant WhatsApp Delivery Action */}
            <div className={styles.whatsAppBanner}>
              <p className={styles.whatsAppBannerText}>
                <strong>⚡ Want instant delivery in 5–10 minutes?</strong><br />
                Message our verification team on WhatsApp with your Order ID for fast-track activation.
              </p>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsAppButton}
              >
                <MessageCircle size={18} />
                <span>Confirm Instantly on WhatsApp →</span>
              </a>
            </div>

            <div className={styles.confirmationActions}>
              <Link href="/products#products-by-category" className={styles.continueButton}>
                ← Continue Shopping
              </Link>
              <Link href="/account/orders" className={styles.continueButton}>
                View My Account Orders
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
            Tech Solutions BD <span className={styles.titleGradient}>Checkout</span>
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
          <form className={styles.leftColumn} onSubmit={handlePlaceOrder} noValidate>
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
                      <span>Phone / WhatsApp Number <span className={styles.formRequired}>*</span></span>
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
                      <p className={styles.formHelpText}>Used for WhatsApp delivery & order alerts</p>
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

              {/* Submit Order Blue Button (Screenshot 1) */}
              <div style={{ marginTop: "24px" }}>
                <button
                  type="submit"
                  className={styles.submitOrderButton}
                >
                  <span>Submit Order →</span>
                </button>
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
                  <p className={styles.trustBadgeDesc}>Sent directly to Email & WhatsApp</p>
                </div>
              </div>
              <div className={styles.trustBadgeItem}>
                <Headphones className={styles.trustBadgeIcon} style={{ color: "#6C63FF" }} />
                <div>
                  <h4 className={styles.trustBadgeTitle}>Live Support</h4>
                  <p className={styles.trustBadgeDesc}>WhatsApp: 01641699879</p>
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
                          width={56}
                          height={56}
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
                      <span>✓ {appliedCoupon} ({COUPONS[appliedCoupon].label})</span>
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
                    <span>Coupon ({appliedCoupon})</span>
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
                  <MessageCircle size={14} style={{ color: "#6C63FF" }} />
                  <span>Dedicated WhatsApp Support Available 24/7</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
