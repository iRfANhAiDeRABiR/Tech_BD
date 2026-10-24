import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { BackgroundParticles } from "@/components/layout/BackgroundParticles";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { getStoreCategories } from "@/data/products";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_BANGLADESH_KEYWORDS,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
} from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tech Solutions BD | Buy Genuine Software & Digital Licenses in Bangladesh",
    template: "%s | Tech Solutions BD",
  },
  description:
    "Buy genuine Microsoft Windows 11/10 Pro keys, Office 2024, Office 365, Antivirus, IDM & Adobe licenses in Bangladesh with bKash, Nagad & Rocket. 100% Genuine, Lifetime Activation with Instant Delivery.",
  keywords: DEFAULT_BANGLADESH_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-BD": SITE_URL,
      "bn-BD": SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    alternateLocale: "bn_BD",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Tech Solutions BD | Genuine Software & Digital Licenses in Bangladesh",
    description:
      "Buy genuine Windows 11/10 Pro keys, Office 2024, Office 365, IDM & Antivirus licenses in Bangladesh with bKash & Nagad. Instant digital delivery guaranteed.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Tech Solutions BD - Genuine Digital Products Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Solutions BD | Genuine Software Licenses in Bangladesh",
    description:
      "Instant delivery of Windows 11, Office 2024, Antivirus & IDM licenses in Bangladesh via bKash, Nagad, Rocket.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": "BD-13",
    "geo.placename": "Dhaka, Bangladesh",
    "geo.position": "23.8103;90.4125",
    ICBM: "23.8103, 90.4125",
    "payment-methods": "bKash, Nagad, Rocket, Upay, Bank Transfer",
    "target-audience": "Bangladesh Software Buyers, Gamers, Professionals, Students",
  },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebSiteJsonLd()),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <BackgroundParticles />
        <StorefrontShell categories={categories}>
          {children}
        </StorefrontShell>
      </body>
    </html>
  );
}
