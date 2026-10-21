import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { BackgroundParticles } from "@/components/layout/BackgroundParticles";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { AuthModal } from "@/components/layout/AuthModal";
import { GlobalToaster } from "@/components/toast/GlobalToaster";
import { getStoreCategories } from "@/data/products";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Tech Solutions BD",
    template: "%s | Tech Solutions BD",
  },
  description:
    "Genuine digital software licenses and subscriptions in Bangladesh.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getStoreCategories();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <BackgroundParticles />

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
      </body>
    </html>
  );
}
