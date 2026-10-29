import type { NextConfig } from "next";

// Build a practical Content-Security-Policy from the actual dependencies:
// - Supabase (auth + REST) needs its project URL in connect-src.
// - Cloudinary hosts product images.
// - 'unsafe-inline' for styles is required by Next.js injected styles and
//   React inline style attributes; script-src keeps 'unsafe-inline' because
//   the App Router bootstrap requires it unless a nonce middleware is added.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com" + (supabaseUrl ? ` ${supabaseUrl}` : ""),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  allowedDevOrigins: ["*.replit.dev", "*.pike.replit.dev", "127.0.0.1"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/software-download",
        destination: "/downloads",
        permanent: true,
      },
      {
        source: "/software-downloads",
        destination: "/downloads",
        permanent: true,
      },
    ];
  },
  images: {
    localPatterns: [
      {
        pathname: "/**",
        search: "",
      },
      {
        pathname: "/**",
        search: "?v=*",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
