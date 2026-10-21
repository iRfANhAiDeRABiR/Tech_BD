"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { AuthModal } from "@/components/layout/AuthModal";
import { CartProvider } from "@/components/cart/CartProvider";
import { GlobalToaster } from "@/components/toast/GlobalToaster";
import type { StoreCategory } from "@/types/product";

interface StorefrontShellProps {
  children: React.ReactNode;
  categories: StoreCategory[];
}

export function StorefrontShell({ children, categories }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="admin-root-shell">
        {children}
        <GlobalToaster />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <CartProvider>
        <CategorySidebar categories={categories} />
        <Header />
        <div className="main-content">
          {children}
          <Footer />
        </div>
        <WhatsAppButton />
        <AuthModal />
        <GlobalToaster />
      </CartProvider>
    </div>
  );
}

