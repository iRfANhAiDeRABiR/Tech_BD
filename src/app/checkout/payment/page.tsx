"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PaymentGatewayPage, {
  type PaymentGatewayOrder,
  type SubmittedOrderData,
} from "@/components/payment/PaymentGatewayPage";
import { useCart } from "@/components/cart/CartProvider";

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<PaymentGatewayOrder | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("techbd_pending_payment");
      if (!raw) {
        router.replace("/checkout");
        return;
      }

      const parsed: PaymentGatewayOrder = JSON.parse(raw);
      if (!parsed || !parsed.refId || !parsed.total) {
        router.replace("/checkout");
        return;
      }

      setOrder(parsed);
      setIsReady(true);
    } catch {
      router.replace("/checkout");
    }
  }, [router]);

  if (!isReady || !order) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#0B0F19",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid rgba(255, 255, 255, 0.1)",
              borderTopColor: "#0ea5e9",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: "14px", margin: 0 }}>পেমেন্ট গেটওয়ে লোড হচ্ছে...</p>
        </div>
      </main>
    );
  }

  const handleCancel = () => {
    router.push("/checkout");
  };

  const handleSuccess = (confirmed: SubmittedOrderData) => {
    clearCart();
    try {
      sessionStorage.removeItem("techbd_pending_payment");
      sessionStorage.setItem("techbd_confirmed_order", JSON.stringify(confirmed));
    } catch {
      // ignore
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0B0F19",
        width: "100%",
      }}
    >
      <PaymentGatewayPage
        order={order}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
