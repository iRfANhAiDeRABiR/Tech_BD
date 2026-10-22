"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import { BkashLogo, NagadLogo, RocketLogo } from "@/components/common/PaymentLogos";
import styles from "./PaymentGatewayPage.module.css";

export interface PaymentGatewayOrderItem {
  productId: string;
  optionId?: string | null;
  optionName?: string | null;
  optionType?: string | null;
  productName: string;
  productImage?: string | null;
  unitPrice: number;
  originalUnitPrice?: number | null;
  quantity: number;
}

export interface PaymentGatewayOrder {
  refId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  totalPrice: string;
  paymentMethod: "bkash" | "nagad" | "rocket";
  notes?: string | null;
  couponCode?: string | null;
  items: PaymentGatewayOrderItem[];
}

export interface SubmittedOrderData {
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

interface PaymentGatewayPageProps {
  order: PaymentGatewayOrder;
  onCancel: () => void;
  onSuccess: (data: SubmittedOrderData) => void;
}

interface GatewayConfig {
  id: "bkash" | "nagad" | "rocket";
  name: string;
  receiverNumber: string;
  helpline: string;
  ussdCode: string;
  LogoComponent: React.ComponentType<{ className?: string; size?: number }>;
}

const GATEWAYS: Record<"bkash" | "nagad" | "rocket", GatewayConfig> = {
  bkash: {
    id: "bkash",
    name: "bKash",
    receiverNumber: "01641699879",
    helpline: "16247",
    ussdCode: "*247#",
    LogoComponent: BkashLogo,
  },
  nagad: {
    id: "nagad",
    name: "Nagad",
    receiverNumber: "01641699879",
    helpline: "16167",
    ussdCode: "*167#",
    LogoComponent: NagadLogo,
  },
  rocket: {
    id: "rocket",
    name: "Rocket",
    receiverNumber: "015189028225",
    helpline: "16216",
    ussdCode: "*322#",
    LogoComponent: RocketLogo,
  },
};

export default function PaymentGatewayPage({
  order,
  onCancel,
  onSuccess,
}: PaymentGatewayPageProps) {
  const methodKey = order.paymentMethod.toLowerCase() as "bkash" | "nagad" | "rocket";
  const currentGateway = GATEWAYS[methodKey] || GATEWAYS.bkash;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [senderNumber, setSenderNumber] = useState(order.customerPhone || "");
  const [trxId, setTrxId] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrderData | null>(null);

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore
    }
  };

  // Step 1: Proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = senderNumber.replace(/\D/g, "");
    if (clean.length !== 11 || !clean.startsWith("01")) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)");
      return;
    }
    if (!agreeTerms) {
      setError("শর্তাবলী ও নিয়মাবলীতে সম্মত হতে হবে");
      return;
    }
    setError("");
    setStep(2);
  };

  // Step 2: Confirm Transaction & Submit Order
  const handleConfirmTrx = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTrx = trxId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanSender = senderNumber.replace(/\D/g, "");

    if (methodKey === "bkash") {
      if (cleanTrx.length < 8 || cleanTrx.length > 12) {
        setError("দয়া করে সঠিক বিকাশ Transaction ID (TrxID) লিখুন (সাধারণত ৮-১০ অক্ষরের হয়)।");
        return;
      }
    } else if (methodKey === "nagad") {
      if (cleanTrx.length < 6 || cleanTrx.length > 12) {
        setError("দয়া করে সঠিক নগদ Transaction ID (TrxID) লিখুন (সাধারণত ৮ অক্ষরের হয়)।");
        return;
      }
    } else {
      if (cleanTrx.length < 6 || cleanTrx.length > 14) {
        setError("দয়া করে সঠিক রকেট Transaction ID (TrxID) লিখুন।");
        return;
      }
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: order.customerName,
            phone: order.customerPhone,
            email: order.customerEmail,
          },
          payment: {
            method: currentGateway.id,
            label: `${currentGateway.name} Send Money`,
            paymentNumber: currentGateway.receiverNumber,
            senderNumber: cleanSender,
            transactionId: cleanTrx,
          },
          notes: order.notes || null,
          couponCode: order.couponCode || null,
          items: order.items.map((it) => ({
            productId: it.productId,
            optionId: it.optionId || undefined,
            quantity: it.quantity,
          })),
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("এই ট্রানজেকশন আইডি (TrxID) ইতিপূর্বে ব্যবহার করা হয়েছে। অনুগ্রহ করে আপনার নতুন ও সঠিক TrxID লিখুন।");
          return;
        }
        throw new Error(resData.message || "Failed to submit order");
      }

      const confirmedData: SubmittedOrderData = {
        id: resData.order?.id || order.refId,
        orderNumber: resData.order?.orderNumber || order.refId,
        total: order.total,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        paymentMethod: currentGateway.name,
        senderNumber: cleanSender,
        transactionId: cleanTrx,
      };

      setSubmittedOrder(confirmedData);
      onSuccess(confirmedData);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "পেমেন্ট যাচাইয়ের অনুরোধ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Logo = currentGateway.LogoComponent;

  const buildWhatsAppMessage = () => {
    const ref = submittedOrder?.orderNumber || order.refId;
    const msg = [
      `🛒 *Payment Verification - Tech Solutions BD*`,
      `🆔 *Order Ref:* #${ref}`,
      `👤 *Customer:* ${order.customerName}`,
      `📧 *Email:* ${order.customerEmail}`,
      `💳 *Method:* ${currentGateway.name}`,
      `📱 *Sender:* ${senderNumber}`,
      `🔖 *TrxID:* ${trxId}`,
      `💰 *Amount:* ${order.totalPrice}`,
      ``,
      `Hello, I have submitted payment for my software order. Please verify and confirm activation.`,
    ].join("\n");
    return `https://wa.me/8801641699879?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        {/* ===================================================================
            HEADER PER PAYMENT METHOD
           =================================================================== */}
        {methodKey === "bkash" && (
          <div className={styles.bkashHeader}>
            <div className={styles.bkashLogoWrap}>
              <Logo size={42} className="h-9 w-auto" />
            </div>
            <div className={styles.subHeaderRow}>
              <div className={styles.companyMeta}>
                <img
                  src="/logo-icon.png"
                  alt="Tech Solutions BD"
                  className={styles.companyLogo}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/logo.png";
                  }}
                />
                <div>
                  <div className={styles.companyName}>Tech Solutions BD</div>
                  <div className={styles.invoiceNum}>Invoice: {order.refId}</div>
                </div>
              </div>
              <div className={styles.amountMeta}>
                <span className={styles.amountMetaLabel}>Amount</span>
                <span className={styles.amountMetaValBkash}>{order.totalPrice}</span>
              </div>
            </div>
          </div>
        )}

        {methodKey === "nagad" && (
          <div className={styles.nagadHeader}>
            <div className={styles.companyMeta}>
              <div className={styles.nagadLogoBadge}>
                <Logo size={28} />
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.02em" }}>
                  Tech Solutions BD
                </div>
                <div style={{ fontSize: "10px", color: "#fecaca", fontFamily: "var(--font-mono, monospace)" }}>
                  Invoice: {order.refId}
                </div>
              </div>
            </div>
            <div className={styles.amountMeta}>
              <span className={styles.amountMetaLabel} style={{ color: "#fecaca" }}>Total Amount</span>
              <span className={styles.nagadAmountVal}>{order.totalPrice}</span>
            </div>
          </div>
        )}

        {methodKey === "rocket" && (
          <div className={styles.rocketHeader}>
            <div className={styles.rocketTopRow}>
              <div className={styles.companyMeta}>
                <div className={styles.rocketLogoBadge}>
                  <Logo size={28} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>
                    ডাচ-বাংলা ব্যাংক রকেট (Rocket)
                  </div>
                  <div style={{ fontSize: "10px", color: "#e9d5ff" }}>
                    Tech Solutions BD &bull; Invoice: {order.refId}
                  </div>
                </div>
              </div>
              <span className={styles.rocketAmountVal}>{order.totalPrice}</span>
            </div>
            <div className={styles.rocketSubLine}>
              <span>ডায়াল করুন *322#</span>
              <span>হেল্পলাইন: 16216</span>
            </div>
          </div>
        )}

        {/* ===================================================================
            BODY CONTENT
           =================================================================== */}
        <div
          className={
            methodKey === "bkash"
              ? styles.bodyBkash
              : methodKey === "nagad"
              ? styles.bodyNagad
              : styles.bodyRocket
          }
        >
          {/* ─────────────────────────────────────────────────────────────
              STEP 1: SENDER NUMBER ENTRY
             ───────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleProceedToStep2}>
              <div className={styles.stepHeader}>
                <span className={styles.stepPill}>
                  <span>ধাপ ১: সেন্ডার একাউন্ট নম্বর</span>
                </span>
                <h2 className={styles.stepTitle}>
                  {methodKey === "bkash" && "Your bKash Account number"}
                  {methodKey === "nagad" && "Your Nagad Account Number"}
                  {methodKey === "rocket" && "Your Rocket Account Number"}
                </h2>
                <p className={styles.stepSubtitle}>
                  যে {currentGateway.name} নম্বর থেকে আপনি টাকা পাঠাবেন সেই নম্বরটি লিখুন
                </p>
              </div>

              <div className={styles.innerWhiteCard}>
                <label className={styles.inputLabel}>
                  Sender Mobile Number (১১ ডিজিট) *
                </label>
                <input
                  type="tel"
                  maxLength={11}
                  value={senderNumber}
                  onChange={(e) => {
                    setSenderNumber(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g 01XXXXXXXXX"
                  autoFocus
                  className={styles.senderPhoneInput}
                />

                {error && (
                  <div className={styles.errorMessage}>
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="pg-terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <label htmlFor="pg-terms">
                    By clicking on <strong>Confirm</strong>, you are agreeing to the terms & conditions
                  </label>
                </div>
              </div>

              <div className={styles.actionGrid}>
                <button
                  type="button"
                  onClick={onCancel}
                  className={styles.btnCancel}
                >
                  Close / বাতিল
                </button>
                <button
                  type="submit"
                  className={styles.btnConfirm}
                >
                  Confirm / পরবর্তী
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: SEND MONEY & ENTER TRXID
             ───────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleConfirmTrx}>
              <div className={styles.step2Header}>
                <div>
                  <span className={styles.step2HeaderSub}>ধাপ ২: Send Money ও TrxID</span>
                  <h3 className={styles.step2HeaderTitle}>Send Money Instruction</h3>
                </div>
                <div className={styles.officialBadge}>
                  <ShieldCheck size={14} style={{ color: "#86efac" }} />
                  <span>Official Verification</span>
                </div>
              </div>

              <div className={styles.noticeBanner}>
                আপনার <strong>{currentGateway.name}</strong> অ্যাপ বা ডায়াল কোড (<strong>{currentGateway.ussdCode}</strong>) থেকে নিচের নম্বরে <strong>Send Money</strong> করুন:
              </div>

              <div className={styles.innerWhiteCard}>
                {/* Receiver Box */}
                <div className={styles.accountBox}>
                  <div>
                    <span className={styles.accountBoxLabel}>
                      {currentGateway.name} Personal (Receiver Number)
                    </span>
                    <span className={styles.accountBoxValue}>
                      {currentGateway.receiverNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentGateway.receiverNumber, "receiver")}
                    className={`${styles.btnCopy} ${copiedField === "receiver" ? styles.btnCopied : ""}`}
                  >
                    {copiedField === "receiver" ? (
                      <>
                        <Check size={13} style={{ color: "#047857" }} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Amount Box */}
                <div className={styles.accountBox}>
                  <div>
                    <span className={styles.accountBoxLabel}>Exact Amount to Send</span>
                    <span className={styles.accountBoxValueAmount}>{order.totalPrice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.total.toString(), "amount")}
                    className={`${styles.btnCopy} ${copiedField === "amount" ? styles.btnCopied : ""}`}
                  >
                    {copiedField === "amount" ? (
                      <>
                        <Check size={13} style={{ color: "#047857" }} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sender Reference */}
                <div className={styles.senderRefRow}>
                  <span>আপনার সেন্ডার নম্বর:</span>
                  <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#1e293b" }}>
                    {senderNumber}
                  </span>
                </div>
              </div>

              {/* TrxID Input Card */}
              <div className={styles.trxIdCard}>
                <label className={styles.inputLabel}>
                  Enter Transaction ID (TrxID) *
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => {
                    setTrxId(e.target.value.toUpperCase());
                    if (error) setError("");
                  }}
                  placeholder={
                    methodKey === "bkash"
                      ? "E.G. BL84J2K9LM"
                      : methodKey === "nagad"
                      ? "E.G. 72AK94X2"
                      : "E.G. 2938471928"
                  }
                  maxLength={25}
                  className={styles.trxInput}
                  autoFocus
                />

                {error && (
                  <div className={styles.errorMessage} style={{ justifyContent: "flex-start", marginTop: "6px" }}>
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <p className={styles.trxHelper}>
                  টাকা পাঠানোর পর প্রাপ্ত SMS বা স্টেটমেন্টের Transaction ID (TrxID) দিন
                </p>
              </div>

              <div className={styles.actionGrid} style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={styles.btnCancel}
                >
                  Back / পেছনে
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.btnSubmitOrder}
                >
                  {isSubmitting ? (
                    <span>যাচাই হচ্ছে...</span>
                  ) : (
                    <span>Verify & Submit →</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: VERIFICATION SUBMITTED RECEIPT
             ───────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className={styles.step3Wrap}>
              <div className={styles.successCircle}>
                <CheckCircle2 size={34} />
              </div>

              <div>
                <span className={styles.stepPill} style={{ background: "#fbbf24", color: "#020617", border: "none" }}>
                  <span>ভেরিফিকেশন চলছে (Verification In Progress)</span>
                </span>
                <h3 className={styles.stepTitle} style={{ fontSize: "20px" }}>
                  Payment Submitted Successfully!
                </h3>
                <p className={styles.stepSubtitle}>
                  আপনার পেমেন্ট তথ্য সফলভাবে গ্রহণ করা হয়েছে। ভেরিফিকেশন কনফার্ম হওয়া মাত্রই আপনার ইমেইলে লাইসেন্স পৌঁছে যাবে।
                </p>
              </div>

              <div className={styles.receiptCard}>
                <div className={styles.receiptRowBorder}>
                  <span className={styles.receiptLabel}>Order Reference:</span>
                  <span className={styles.receiptValueMono}>
                    #{submittedOrder?.orderNumber || order.refId}
                  </span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Customer Name:</span>
                  <span className={styles.receiptValue}>{order.customerName}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Delivery Email:</span>
                  <span className={styles.receiptValue}>{order.customerEmail}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Payment Gateway:</span>
                  <span className={styles.receiptValue} style={{ color: "#7c3aed" }}>
                    {currentGateway.name}
                  </span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Sender Number:</span>
                  <span className={styles.receiptValue} style={{ fontFamily: "var(--font-mono, monospace)" }}>
                    {senderNumber}
                  </span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Receiver Number:</span>
                  <span className={styles.receiptValue} style={{ fontFamily: "var(--font-mono, monospace)" }}>
                    {currentGateway.receiverNumber}
                  </span>
                </div>
                <div className={styles.receiptRowBorder}>
                  <span className={styles.receiptLabel}>Transaction ID:</span>
                  <span className={styles.receiptValueTrx}>{trxId}</span>
                </div>
                <div className={styles.receiptTotalRow}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Total Amount:</span>
                  <span className={styles.receiptTotalValue}>{order.totalPrice}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a
                  href={buildWhatsAppMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnWhatsApp}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp এ সরাসরি যোগাযোগ করুন</span>
                </a>

                <Link href="/products#products-by-category" className={styles.btnReturnHome}>
                  Return to Homepage / মূল পেজে ফিরুন
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            BOTTOM BRAND FOOTER
           =================================================================== */}
        <div className={styles.modalFooter}>
          <div className={styles.footerSecure}>
            <ShieldCheck size={16} style={{ color: "#059669" }} />
            <span>100% Secure Official Payment</span>
          </div>
          <div className={styles.footerHelpline}>
            <PhoneCall size={14} style={{ color: "#2563eb" }} />
            <span>Helpline: {currentGateway.helpline}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

