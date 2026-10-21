"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { ProductSummary } from "@/types/product";
import { toPlainText } from "@/lib/text";
import styles from "@/app/cart/cart.module.css";
import { useCart } from "./CartProvider";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import { getUserFriendlyError } from "@/lib/errorSanitizer";

interface CartPageClientProps {
  products: ProductSummary[];
}

const COUPONS = {
  TECHBD10: {
    rate: 0.1,
    label: "10% off",
  },
} as const;

type CouponCode = keyof typeof COUPONS;

interface CouponFeedback {
  tone: "success" | "error";
  message: string;
}

type CheckoutStep = 1 | 2 | 3 | 4;

interface PaymentMethod {
  label: string;
  number: string;
  accent: string;
  logoUrl: string;
}

interface SubmittedOrder {
  id: string;
  orderNumber: string;
  total: number;
}

interface CheckoutOrderResponse {
  order?: SubmittedOrder;
  message?: string;
}

const PAYMENT_METHODS: Record<string, PaymentMethod> = {
  bkash: {
    label: "Bkash Send Money",
    number: "01641699879",
    accent: "#E2136E",
    logoUrl: "/img_content/bkash.png",
  },
  nagad: {
    label: "Nagad Send Money",
    number: "01641699879",
    accent: "#F6821F",
    logoUrl: "/img_content/nagad.png",
  },
  rocket: {
    label: "Rocket Send Money",
    number: "015189028225",
    accent: "#8C3494",
    logoUrl: "/img_content/rocket.png",
  },
  upay: {
    label: "Upay Send Money",
    number: "01518902822",
    accent: "#00A859",
    logoUrl: "/img_content/upay.png",
  },
} as const;

type PaymentMethodKey = keyof typeof PAYMENT_METHODS;

function isCouponCode(value: string): value is CouponCode {
  return Object.prototype.hasOwnProperty.call(COUPONS, value);
}

function formatPrice(value: number): string {
  return `৳${value.toLocaleString("en-BD")}`;
}

export function CartPageClient({
  products,
}: CartPageClientProps) {
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponCode | null>(null);
  const [couponFeedback, setCouponFeedback] =
    useState<CouponFeedback | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(1);
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodKey | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submittedOrder, setSubmittedOrder] =
    useState<SubmittedOrder | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [copiedPaymentNumber, setCopiedPaymentNumber] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(
    null,
  );

  const {
    items,
    isHydrated,
    updateQuantity,
    removeItem,
    reconcileCart,
    clearCart,
  } = useCart();

  const productsById = useMemo(
    () =>
      new Map(
        products.map((product) => [product.id, product]),
      ),
    [products],
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    reconcileCart((line) => productsById.has(line.productId));
  }, [isHydrated, productsById, reconcileCart]);

  const cartProducts = items.flatMap((line) => {
    const product = productsById.get(line.productId);

    if (!product) {
      return [];
    }

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
    (total, line) =>
      total + line.unitPrice * line.quantity,
    0,
  );

  const originalSubtotal = cartProducts.reduce(
    (total, line) => {
      const originalPrice = line.originalPrice ?? line.unitPrice;

      return total + originalPrice * line.quantity;
    },
    0,
  );

  const savings = Math.max(0, originalSubtotal - subtotal);
  const selectedPayment = selectedMethod
    ? PAYMENT_METHODS[selectedMethod]
    : null;

  const couponDiscount = appliedCoupon
    ? Math.min(
      subtotal,
      Math.round(subtotal * COUPONS[appliedCoupon].rate),
    )
    : 0;

  const total = Math.max(0, subtotal - couponDiscount);

  useEffect(() => {
    if (!checkoutOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [checkoutOpen]);

  function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCode = couponInput.trim().toUpperCase();

    if (!isCouponCode(normalizedCode)) {
      setAppliedCoupon(null);
      const msg = "That coupon code is not valid. Check it and try again.";
      setCouponFeedback({
        tone: "error",
        message: msg,
      });
      notify.error("Invalid coupon", {
        description: msg,
        id: "coupon-toast",
      });
      return;
    }

    setCouponInput(normalizedCode);
    setAppliedCoupon(normalizedCode);
    const msg = `${normalizedCode} applied — ${COUPONS[normalizedCode].label}.`;
    setCouponFeedback({
      tone: "success",
      message: msg,
    });
    notify.success("Coupon applied", {
      description: msg,
      id: "coupon-toast",
    });
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponFeedback(null);
    notify.info("Coupon removed", {
      description: "Coupon discount has been removed.",
      id: "coupon-toast",
    });
  }

  function resetCheckout() {
    setCheckoutStep(1);
    setSelectedMethod(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setSenderNumber("");
    setTransactionId("");
    setSubmittedOrder(null);
    setIsSubmittingOrder(false);
    setCopiedPaymentNumber(false);
    setCheckoutError(null);
  }

  async function openCheckout() {
    resetCheckout();
    setCheckoutOpen(true);

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

        if (profile && profile.username) {
          setCustomerName(profile.username);
          setCustomerEmail(user.email ?? "");
          // Prefer phone_e164, fallback to whatsapp_e164
          // Ensure phone is always a string to prevent .trim() errors
          const phone = String(profile.phone_e164 ?? profile.whatsapp_e164 ?? "");
          setCustomerPhone(phone);

          // Only skip to payment step if we have essential contact info
          if (profile.username && user.email && phone) {
            setCheckoutStep(2);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load user profile for checkout:", error);
      // Fallback to manual entry (Step 1) remains active via resetCheckout defaults
    }
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    setCheckoutError(null);
  }

  function goBack() {
    setCheckoutError(null);
    setCheckoutStep((currentStep) =>
      Math.max(1, currentStep - 1) as CheckoutStep,
    );
  }

  function validateStepOne() {
    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !customerEmail.trim() ||
      !/^\S+@\S+\.\S+$/.test(customerEmail.trim())
    ) {
      const msg = "Please complete your name, phone, and a valid email.";
      setCheckoutError(msg);
      notify.warning("Required information missing", {
        description: msg,
        id: "checkout-val-1",
      });
      return false;
    }

    setCheckoutError(null);
    return true;
  }

  function validateStepTwo() {
    if (!selectedMethod) {
      const msg = "Please select a payment method.";
      setCheckoutError(msg);
      notify.warning("Payment method required", {
        description: msg,
        id: "checkout-val-2",
      });
      return false;
    }

    setCheckoutError(null);
    return true;
  }

  function validateStepThree() {
    if (!senderNumber.trim() || !transactionId.trim()) {
      const msg = "Please enter the sender number and transaction ID.";
      setCheckoutError(msg);
      notify.warning("Transaction details required", {
        description: msg,
        id: "checkout-val-3",
      });
      return false;
    }

    setCheckoutError(null);
    return true;
  }

  async function copyPaymentNumber() {
    if (!selectedPayment?.number) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedPayment.number);
      setCopiedPaymentNumber(true);
      notify.success("Number copied", {
        description: `${selectedPayment.label} number copied to clipboard.`,
        id: "payment-copy-toast",
      });
      window.setTimeout(() => setCopiedPaymentNumber(false), 1500);
    } catch {
      notify.error("Failed to copy", {
        description: "Could not copy number to clipboard.",
        id: "payment-copy-toast",
      });
    }
  }

  function buildOrderMessage() {
    const payment = selectedMethod
      ? PAYMENT_METHODS[selectedMethod]
      : null;

    return [
      "🛒 *New Order - Tech Solutions BD*",
      submittedOrder ? `🆔 *Order ID:* ${submittedOrder.orderNumber}` : "🆔 *Order ID:*",
      "",
      `👤 *Name:* ${customerName.trim()}`,
      `📱 *Mobile/WhatsApp:* ${customerPhone.trim()}`,
      `📧 *Email:* ${customerEmail.trim()}`,
      "",
      `💳 *Payment Method:* ${payment?.label ?? "N/A"}`,
      `💰 *Total Paid:* ${formatPrice(total)}`,
      `🔖 *TrxID:* ${transactionId.trim()}`,
      "",
      "Thank you!",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function submitCheckoutOrder() {
    if (!selectedMethod || !selectedPayment) {
      setCheckoutError("Please select a payment method.");
      return null;
    }

    setIsSubmittingOrder(true);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim(),
          },
          payment: {
            method: selectedMethod,
            label: selectedPayment.label,
            paymentNumber: selectedPayment.number,
            senderNumber: senderNumber.trim(),
            transactionId: transactionId.trim(),
          },
          coupon: appliedCoupon ? { code: appliedCoupon } : null,
          totals: {
            subtotal,
            discount: couponDiscount,
            total,
          },
          items: cartProducts.map(
            ({ line, product, quantity, unitPrice, originalPrice, optionLabel }) => ({
              productId: product.id,
              optionId: line.optionId,
              optionName: optionLabel ?? undefined,
              optionType: line.optionType,
              productName: toPlainText(product.name),
              productImage: product.image,
              unitPrice,
              originalUnitPrice: originalPrice ?? null,
              quantity,
            }),
          ),
        }),
      });

      const result = (await response.json()) as CheckoutOrderResponse;

      if (!response.ok || !result.order) {
        throw new Error(result.message ?? "Could not save your order.");
      }

      // Order saved successfully — empty the cart so items aren't
      // re-purchasable or lingering after checkout.
      clearCart();
      setSubmittedOrder(result.order);

      notify.success("Order placed successfully", {
        description: `Your order #${result.order.orderNumber} has been received.`,
        duration: 6000,
        id: `order-success-${result.order.orderNumber}`,
      });

      return result.order;
    } catch (error) {
      const sanitized = getUserFriendlyError(
        error,
        "Please check your information and try again."
      );
      setCheckoutError(sanitized);
      notify.error("Order could not be placed", {
        description: sanitized,
        id: "order-error-toast",
      });
      return null;
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  async function handleCheckoutAdvance() {
    if (checkoutStep === 1) {
      if (!validateStepOne()) {
        return;
      }

      setCheckoutStep(2);
      return;
    }

    if (checkoutStep === 2) {
      if (!validateStepTwo()) {
        return;
      }

      setCheckoutStep(3);
      return;
    }

    if (checkoutStep === 3) {
      if (!validateStepThree()) {
        return;
      }

      const order = await submitCheckoutOrder();

      if (order) {
        setCheckoutStep(4);
      }
    }
  }

  function launchWhatsAppOrder() {
    const message = buildOrderMessage();
    const url = `https://wa.me/66647109664?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!isHydrated) {
    return (
      <main className={styles.page}>
        <div className="container">
          <div className={styles.loading} role="status">
            Loading your cart...
          </div>
        </div>
      </main>
    );
  }

  // Keep the checkout success modal mounted even though the cart was
  // just cleared — only show the empty state once the modal is closed.
  const showEmptyCart =
    cartProducts.length === 0 && !(checkoutOpen && submittedOrder);

  if (showEmptyCart) {
    return (
      <main className={styles.page}>
        <div className="container">
          <section className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              🛒
            </span>

            <h1>Your cart is empty</h1>

            <p>
              Browse our digital software catalogue and add products
              to your cart.
            </p>

            <Link
              href="/products#products-by-category"
              className="btn btn--primary btn--lg"
            >
              Browse Products
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <div>
            <span className="section-tag">Shopping Cart</span>

            <h1 className={styles.title}>
              Your <span className="gradient-text">Cart</span>
            </h1>

            <p className={styles.subtitle}>
              Review your selected digital products.
            </p>
          </div>

          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              clearCart();
              notify.info("Cart cleared", {
                description: "All items have been removed from your shopping cart.",
                id: "cart-cleared",
              });
            }}
          >
            Clear Cart
          </button>
        </div>

        <div className={styles.layout}>
          <section
            className={styles.items}
            aria-label="Cart products"
          >
            {cartProducts.map(({ line, product, quantity, unitPrice, originalPrice, optionLabel }) => {
              const name = toPlainText(product.name);
              const hasOriginalPrice =
                originalPrice !== null &&
                originalPrice > unitPrice;

              return (
                <article
                  className={styles.item}
                  key={`${product.id}:${line.optionId ?? "base"}`}
                >
                  <Link
                    href={`/products/${product.id}`}
                    className={styles.imageLink}
                    aria-label={`View ${name}`}
                  >
                    <Image
                      src={product.image}
                      alt={name}
                      width={140}
                      height={110}
                      sizes="140px"
                      className={styles.image}
                    />
                  </Link>

                  <div className={styles.itemInfo}>
                    <span className={styles.category}>
                      {product.category}
                    </span>

                    <Link
                      href={`/products/${product.id}`}
                      className={styles.name}
                    >
                      {name}
                    </Link>

                    {optionLabel && (
                      <span className={styles.category}>
                        Type: {optionLabel}
                      </span>
                    )}

                    <div className={styles.prices}>
                      <span className={styles.price}>
                        {formatPrice(unitPrice)}
                      </span>

                      {hasOriginalPrice && (
                        <span className={styles.originalPrice}>
                          {formatPrice(originalPrice!)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.itemActions}>
                    <div
                      className={styles.quantity}
                      role="group"
                      aria-label={`Quantity for ${name}`}
                    >
                      <button
                        type="button"
                        aria-label={`Decrease ${name} quantity`}
                        disabled={quantity <= 1}
                        onClick={() =>
                          updateQuantity(product.id, quantity - 1, line.optionId)
                        }
                      >
                        −
                      </button>

                      <span aria-live="polite">{quantity}</span>

                      <button
                        type="button"
                        aria-label={`Increase ${name} quantity`}
                        disabled={quantity >= 99}
                        onClick={() =>
                          updateQuantity(product.id, quantity + 1, line.optionId)
                        }
                      >
                        +
                      </button>
                    </div>

                    <span className={styles.lineTotal}>
                      {formatPrice(unitPrice * quantity)}
                    </span>

                    <button
                      type="button"
                      className={styles.removeButton}
                      aria-label={`Remove ${name} from cart`}
                      onClick={() => {
                        removeItem(product.id, line.optionId);
                        notify.info("Product removed", {
                          description: `${name} was removed from your cart.`,
                          id: `cart-remove-${product.id}`,
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className={styles.summary}>
            <h2>Order Summary</h2>

            <section
              className={styles.coupon}
              aria-labelledby="coupon-title"
            >
              <div className={styles.couponHeading}>
                <h3 id="coupon-title">Have a coupon code?</h3>
                <span>Optional</span>
              </div>

              {appliedCoupon ? (
                <div className={styles.couponApplied}>
                  <div>
                    <strong>{appliedCoupon}</strong>
                    <span>{COUPONS[appliedCoupon].label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label={`Remove ${appliedCoupon} coupon`}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form
                  className={styles.couponForm}
                  onSubmit={applyCoupon}
                >
                  <label htmlFor="coupon-code" className={styles.srOnly}>
                    Coupon code
                  </label>

                  <input
                    id="coupon-code"
                    name="coupon-code"
                    type="text"
                    value={couponInput}
                    onChange={(event) => {
                      setCouponInput(event.target.value.toUpperCase());

                      if (couponFeedback?.tone === "error") {
                        setCouponFeedback(null);
                      }
                    }}
                    placeholder="Enter code"
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="coupon-hint"
                  />

                  <button type="submit" disabled={!couponInput.trim()}>
                    Apply
                  </button>
                </form>
              )}

              {couponFeedback && (
                <p
                  className={
                    couponFeedback.tone === "success"
                      ? styles.couponMessageSuccess
                      : styles.couponMessageError
                  }
                  role={
                    couponFeedback.tone === "error"
                      ? "alert"
                      : "status"
                  }
                >
                  {couponFeedback.message}
                </p>
              )}
            </section>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Products</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Digital delivery</span>
                <span>Free</span>
              </div>

              {savings > 0 && (
                <div
                  className={`${styles.summaryRow} ${styles.savings}`}
                >
                  <span>You save</span>
                  <span>−{formatPrice(savings)}</span>
                </div>
              )}

              {couponDiscount > 0 && appliedCoupon && (
                <div
                  className={`${styles.summaryRow} ${styles.couponSavings}`}
                >
                  <span>Coupon ({appliedCoupon})</span>
                  <span>−{formatPrice(couponDiscount)}</span>
                </div>
              )}
            </div>

            <div className={styles.total}>
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>

            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={openCheckout}
            >
              Proceed to Checkout
            </button>

            <Link href="/products#products-by-category" className={styles.continueLink}>
              ← Continue Shopping
            </Link>
          </aside>
        </div>

        {checkoutOpen && (
          <div
            className={styles.checkoutOverlay}
            role="presentation"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeCheckout();
              }
            }}
          >
            <div className={styles.checkoutModal} role="dialog" aria-modal="true" aria-labelledby="checkout-title">
              <button
                type="button"
                className={styles.checkoutClose}
                onClick={closeCheckout}
                aria-label="Close checkout"
              >
                ✕
              </button>

              <div className={styles.checkoutProgress} aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`${styles.checkoutDot} ${step <= checkoutStep ? styles.checkoutDotActive : ""} ${step < checkoutStep ? styles.checkoutDotDone : ""}`}
                  >
                    {step}
                  </span>
                ))}
              </div>

              {checkoutStep === 1 && (
                <section className={styles.checkoutStep}>
                  <span className={styles.checkoutBadge}>Step 1</span>
                  <h2 id="checkout-title">Your details</h2>
                  <p className={styles.checkoutSubtitle}>
                    Tell us who to contact for the order.
                  </p>

                  <div className={styles.checkoutForm}>
                    <label>
                      <span>Full name</span>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="Enter your full name"
                        autoComplete="name"
                      />
                    </label>

                    <label>
                      <span>Mobile / WhatsApp number</span>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                        placeholder="01XXXXXXXXX"
                        autoComplete="tel"
                      />
                    </label>

                    <label>
                      <span>Email address</span>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(event) => setCustomerEmail(event.target.value)}
                        placeholder="your@email.com"
                        autoComplete="email"
                      />
                    </label>
                  </div>
                </section>
              )}

              {checkoutStep === 2 && (
                <section className={styles.checkoutStep}>
                  <span className={styles.checkoutBadge}>Step 2</span>
                  <h2>Payment method</h2>
                  <p className={styles.checkoutSubtitle}>
                    Choose the mobile banking option you want to use.
                  </p>

                  <div className={styles.paymentGrid}>
                    {(Object.entries(PAYMENT_METHODS) as Array<[
                      PaymentMethodKey,
                      PaymentMethod,
                    ]>).map(([key, payment]) => (
                      <button
                        key={key}
                        type="button"
                        className={`${styles.paymentOption} ${selectedMethod === key ? styles.paymentOptionSelected : ""}`}
                        onClick={() => setSelectedMethod(key)}
                        style={{
                          borderColor:
                            selectedMethod === key
                              ? payment.accent
                              : undefined,
                        }}
                      >
                        <span
                          className={styles.paymentLogo}
                          style={{ backgroundColor: payment.accent }}
                        >
                          <Image
                            src={payment.logoUrl}
                            alt={`${payment.label} logo`}
                            className={styles.paymentLogoImage}
                            width={52}
                            height={52}
                          />
                        </span>
                        <strong>{payment.label}</strong>
                        <span>Tap to select</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {checkoutStep === 3 && selectedMethod && (
                <section className={styles.checkoutStep}>
                  <span className={styles.checkoutBadge}>Step 3</span>
                  <h2>{selectedPayment?.label ?? "Payment"}</h2>
                  <p className={styles.checkoutSubtitle}>
                    Send the amount below, then enter the transaction ID.
                  </p>

                  <div className={styles.paymentHeaderBrand}>
                    <span
                      className={styles.paymentLogo}
                      style={{ backgroundColor: selectedPayment?.accent }}
                    >
                      {selectedPayment && (
                        <Image
                          src={selectedPayment.logoUrl}
                          alt={`${selectedPayment.label} logo`}
                          className={styles.paymentLogoImage}
                          width={52}
                          height={52}
                        />
                      )}
                    </span>
                    <div>
                      <strong>{selectedPayment?.label}</strong>
                      <p>Complete the payment and share the TrxID.</p>
                    </div>
                  </div>

                  <div className={styles.paymentNumberBox}>
                    <span>Send money to</span>
                    <strong>{selectedPayment?.number}</strong>
                    <button
                      className={styles.copyNumberButton}
                      type="button"
                      onClick={copyPaymentNumber}
                    >
                      <span aria-hidden="true">📋</span>
                      {copiedPaymentNumber ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className={styles.checkoutTotalBox}>
                    <span>Total to pay</span>
                    <strong>{formatPrice(total)}</strong>
                  </div>

                  <label>
                    <span>Sender Number</span>
                    <input
                      type="tel"
                      value={senderNumber}
                      onChange={(event) => setSenderNumber(event.target.value)}
                      placeholder="Enter sender mobile number"
                      autoComplete="tel"
                    />
                  </label>

                  <label>
                    <span>Transaction ID</span>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(event) => setTransactionId(event.target.value)}
                      placeholder="e.g. TRX123456789"
                    />
                  </label>
                </section>
              )}

              {checkoutStep === 4 && (
                <section className={`${styles.checkoutStep} ${styles.checkoutStepFinal}`}>
                  <div className={styles.checkoutSuccessIcon} aria-hidden="true">
                    <span>✓</span>
                  </div>
                  <h2>Payment Processing</h2>
                  <p className={styles.checkoutSubtitle}>
                    We&apos;re verifying your payment and will send your license key to your email shortly.
                  </p>

                  {submittedOrder && (
                    <div className={styles.checkoutSummaryBox}>
                      <div>
                        <span>Order ID</span>
                        <strong>{submittedOrder.orderNumber}</strong>
                      </div>
                      <div>
                        <span>Total submitted</span>
                        <strong>{formatPrice(submittedOrder.total)}</strong>
                      </div>
                    </div>
                  )}

                  <p className={styles.checkoutFinalNote}>
                    <strong>For instant delivery, contact us on WhatsApp!</strong>
                  </p>

                  <button
                    type="button"
                    className={`${styles.checkoutWhatsAppAction} btn btn--primary btn--lg`}
                    onClick={() => {
                      launchWhatsAppOrder();
                      closeCheckout();
                    }}
                  >
                    Message Tech Solutions BD on WhatsApp
                  </button>

                  <div className={styles.checkoutFinalActions}>
                    <button
                      type="button"
                      className={styles.checkoutSecondaryAction}
                      onClick={goBack}
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      className={styles.checkoutSecondaryAction}
                      onClick={closeCheckout}
                    >
                      Close
                    </button>
                  </div>
                </section>
              )}

              {checkoutError && (
                <p className={styles.checkoutError} role="alert">
                  {checkoutError}
                </p>
              )}

              {checkoutStep < 4 ? (
                <div className={styles.checkoutActions}>
                  <button
                    type="button"
                    className={styles.checkoutSecondaryAction}
                    onClick={checkoutStep === 1 ? closeCheckout : goBack}
                  >
                    {checkoutStep === 1 ? "Cancel" : "Back"}
                  </button>

                  <button
                    type="button"
                    className={`${styles.checkoutPrimaryAction} btn btn--primary`}
                    onClick={handleCheckoutAdvance}
                    disabled={isSubmittingOrder}
                  >
                    {checkoutStep === 3
                      ? isSubmittingOrder
                        ? "Saving order..."
                        : "Confirm order"
                      : "Continue"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
