export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://www.techsolutions.bd"
).replace(/\/+$/, "");

export const SITE_NAME = "Tech Solutions BD";

export const DEFAULT_BANGLADESH_KEYWORDS = [
  // Primary English Bangladesh search terms
  "Windows 11 Pro key price in Bangladesh",
  "Buy Windows 10 key Bangladesh",
  "Microsoft Office 2024 price in Bangladesh",
  "Office 365 lifetime subscription BD",
  "IDM lifetime license price in Bangladesh",
  "Internet Download Manager serial key bKash",
  "Kaspersky Internet Security Bangladesh",
  "Kaspersky Total Security price in BD",
  "McAfee Total Protection Bangladesh",
  "Adobe Creative Cloud Bangladesh price",
  "Autodesk AutoCAD license price in BD",
  "Canva Pro subscription price in Bangladesh",
  "Buy genuine software in Bangladesh",
  "Digital product shop in Bangladesh",
  "Software license BD online shop",
  "Genuine software keys bKash Nagad",
  "Windows retail key buy Bangladesh",
  "Microsoft partner Bangladesh",
  // Primary Bengali search terms
  "সফটওয়্যার লাইসেন্স বাংলাদেশ",
  "উইন্ডোজ ১১ লাইসেন্স কি বাংলাদেশ",
  "উইন্ডোজ ১০ রিটেইল কি",
  "মাইক্রোসফট অফিস ২০২৪ বাংলাদেশ দাম",
  "আইডিএম লাইফটাইম লাইসেন্স বিকাশ",
  "ক্যাসপারস্কি অ্যান্টিভাইরাস দাম",
  "জেনুইন ডিজিটাল প্রোডাক্ট বাংলাদেশ",
  "বিকাশ দিয়ে সফটওয়্যার কিনুন",
];

export function detectSoftwareBrand(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes("windows") || name.includes("office") || name.includes("visio") || name.includes("project") || name.includes("microsoft") || name.includes("365")) {
    return "Microsoft";
  }
  if (name.includes("idm") || name.includes("internet download manager")) {
    return "Tonec Inc.";
  }
  if (name.includes("kaspersky")) {
    return "Kaspersky Lab";
  }
  if (name.includes("mcafee")) {
    return "McAfee";
  }
  if (name.includes("eset")) {
    return "ESET";
  }
  if (name.includes("adobe")) {
    return "Adobe";
  }
  if (name.includes("autodesk") || name.includes("autocad")) {
    return "Autodesk";
  }
  if (name.includes("canva")) {
    return "Canva";
  }
  if (name.includes("google")) {
    return "Google";
  }
  return "Tech Solutions BD";
}

export function generateOrganizationJsonLd(baseUrl: string = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${baseUrl}/#organization`,
    name: SITE_NAME,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "Premier online store for 100% genuine software licenses, Microsoft Windows keys, Office 2024, Antivirus, and digital products in Bangladesh.",
    telephone: "+8809697399879",
    email: "info@techsolutions.bd",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressRegion: "Dhaka Division",
      postalCode: "1200",
      addressCountry: "BD",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 23.8103,
      longitude: 90.4125,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
    paymentAccepted: [
      "bKash",
      "Nagad",
      "Rocket",
      "Upay",
      "Credit Card",
      "Debit Card",
      "Bank Transfer",
    ],
    currenciesAccepted: "BDT",
    priceRange: "৳৳",
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    sameAs: [
      "https://wa.me/8809697399879",
    ],
  };
}

export function generateWebSiteJsonLd(baseUrl: string = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: SITE_NAME,
    alternateName: ["Tech Solutions", "TechSolutions BD", "TechBD"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["en-US", "bn-BD"],
  };
}

export interface ProductJsonLdInput {
  id: string;
  slug?: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  originalPrice?: number | null;
  category?: string;
  badge?: string | null;
  outOfStock?: boolean;
}

export function generateProductJsonLd(product: ProductJsonLdInput, baseUrl: string = SITE_URL) {
  const brand = detectSoftwareBrand(product.name);
  const cleanImage = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${baseUrl}${product.image.startsWith("/") ? "" : "/"}${product.image}`
    : `${baseUrl}/logo.png`;

  const productUrl = `${baseUrl}/products/${product.slug || product.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    image: [cleanImage],
    description: product.description.slice(0, 300),
    sku: `TSBD-${product.id}`,
    mpn: `TSBD-MPN-${product.id}`,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    category: product.category || "Software",
    offers: {
      "@type": "Offer",
      "@id": `${productUrl}#offer`,
      url: productUrl,
      priceCurrency: "BDT",
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability: product.outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        url: baseUrl,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "BDT",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "BD",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "MIN",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 10,
            unitCode: "MIN",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BD",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "42",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
  baseUrl: string = SITE_URL
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

