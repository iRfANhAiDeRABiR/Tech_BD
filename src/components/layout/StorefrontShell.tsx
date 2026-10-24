"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { FirstOrderPromoBanner } from "@/components/layout/FirstOrderPromoBanner";
import { AuthModal } from "@/components/layout/AuthModal";
import { CartProvider } from "@/components/cart/CartProvider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { GlobalToaster } from "@/components/toast/GlobalToaster";
import type { StoreCategory } from "@/types/product";

interface StorefrontShellProps {
  children: React.ReactNode;
  categories: StoreCategory[];
}

export function StorefrontShell({ children, categories }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isPaymentPage = pathname?.startsWith("/checkout/payment");
  const isCheckout = pathname === "/checkout" || pathname?.startsWith("/checkout");

  if (isAdmin) {
    return (
      <CurrencyProvider>
        <div className="admin-root-shell">
          {children}
          <GlobalToaster />
        </div>
      </CurrencyProvider>
    );
  }

  if (isPaymentPage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0B0F19",
          width: "100%",
          position: "relative",
          zIndex: 10,
        }}
      >
        <CurrencyProvider>
          <CartProvider>
            {children}
            <GlobalToaster />
          </CartProvider>
        </CurrencyProvider>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <CurrencyProvider>
        <CartProvider>
          <CategorySidebar categories={categories} />
          {!isCheckout && <FirstOrderPromoBanner />}
          <Header />
          <div className="main-content">
            {children}
            <Footer />
          </div>
          {!isCheckout && <WhatsAppButton />}
          <AuthModal />
          <GlobalToaster />
        </CartProvider>
      </CurrencyProvider>
    </div>
  );
}

