import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { BackgroundParticles } from "@/components/layout/BackgroundParticles";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
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
        <StorefrontShell categories={categories}>
          {children}
        </StorefrontShell>
      </body>
    </html>
  );
}
