import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { normalizeIp, isIpInCidr } from "@/lib/ip-utils";

// Paths that require admin authentication
const ADMIN_PATHS = ["/admin", "/api/admin"];
// Paths that should not be accessible if already authenticated (e.g., login page)
const AUTH_PATHS = ["/admin/login"];
// Paths that require customer authentication (Supabase)
const CUSTOMER_AUTH_PATHS = ["/account"];

interface CachedBan {
  id: string;
  type: "IP" | "USER";
  target: string;
  targetUserId: string | null;
  targetEmail: string | null;
  reason: string;
  expiresAt: string | null;
}

// In-memory cache for active bans to eliminate remote database queries on every request
let cachedActiveBans: CachedBan[] | null = null;
let lastBansFetchTime = 0;
let bansFetchPromise: Promise<CachedBan[]> | null = null;
const BANS_CACHE_TTL_MS = 30_000; // 30 seconds

export function invalidateProxyBanCache() {
  cachedActiveBans = null;
  lastBansFetchTime = 0;
}

async function getActiveBans(
  supabaseUrl: string,
  supabaseKey: string
): Promise<CachedBan[]> {
  const now = Date.now();
  if (cachedActiveBans && now - lastBansFetchTime < BANS_CACHE_TTL_MS) {
    return cachedActiveBans;
  }

  // If a fetch is already in flight and we have existing cache, return immediately to eliminate latency
  if (cachedActiveBans && bansFetchPromise) {
    return cachedActiveBans;
  }

  if (!bansFetchPromise) {
    bansFetchPromise = (async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/AccessBan?select=id,type,target,targetUserId,targetEmail,reason,expiresAt&isActive=eq.true`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            signal: AbortSignal.timeout(1500),
          }
        );

        if (!res.ok) {
          return cachedActiveBans ?? [];
        }

        const data = await res.json();
        cachedActiveBans = Array.isArray(data) ? (data as CachedBan[]) : [];
        lastBansFetchTime = Date.now();
        return cachedActiveBans;
      } catch {
        return cachedActiveBans ?? [];
      } finally {
        bansFetchPromise = null;
      }
    })();
  }

  // If we already have cached active bans, don't block the request on background refresh
  if (cachedActiveBans) {
    return cachedActiveBans;
  }

  return bansFetchPromise;
}

// Background pre-warm on proxy module load to eliminate 1st-request latency
if (
  typeof window === "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  setTimeout(() => {
    getActiveBans(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).catch(() => {});
  }, 50);
}

function getClientIp(request: NextRequest): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return normalizeIp(cf);
  const real = request.headers.get("x-real-ip");
  if (real) return normalizeIp(real);
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return normalizeIp(first);
  }
  return "127.0.0.1";
}

/**
 * Fast in-memory extraction of user ID and email from Supabase session cookie
 * Avoids slow remote HTTP auth calls on every request.
 */
function extractSupabaseUser(
  request: NextRequest
): { id: string | null; email: string | null } | null {
  try {
    const cookies = request.cookies.getAll();
    const tokenCookies = cookies
      .filter((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!tokenCookies.length) return null;

    let payloadStr = tokenCookies.map((c) => c.value).join("");
    if (!payloadStr) return null;

    if (payloadStr.startsWith("base64-")) {
      payloadStr = Buffer.from(payloadStr.slice(7), "base64").toString("utf-8");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadStr);
    } catch {
      parsed = payloadStr;
    }

    const accessToken = Array.isArray(parsed)
      ? parsed[0]
      : typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>).access_token
      : typeof parsed === "string"
      ? parsed
      : null;

    if (typeof accessToken !== "string" || !accessToken.includes(".")) {
      return null;
    }

    const jwtPayload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64").toString("utf-8")
    );

    return {
      id: jwtPayload.sub ? String(jwtPayload.sub) : null,
      email: jwtPayload.email ? String(jwtPayload.email).toLowerCase() : null,
    };
  } catch {
    return null;
  }
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Fast bypass for static files, public assets, and Next.js internals (<0.01ms)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/banned" ||
    pathname.startsWith("/banned/") ||
    pathname.startsWith("/img_content") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Route classification
  const isAuthPath = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAdminPath =
    !isAuthPath && ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isCustomerAuthPath = CUSTOMER_AUTH_PATHS.some((p) =>
    pathname.startsWith(p)
  );

  // 3. Admin Authentication (NextAuth) - only executed for admin paths
  let adminToken = null;
  if (isAdminPath || isAuthPath) {
    const isSecure = request.nextUrl.protocol === "https:";
    adminToken = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      secureCookie: isSecure,
    });

    if (isAdminPath && !adminToken) {
      if (pathname.startsWith("/api/")) {
        return applySecurityHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        );
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAuthPath && adminToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 4. Access Ban Enforcement (IP & User) with in-memory caching
  // Authenticated admins accessing /admin are exempt to prevent lockout
  const isAdminSession = Boolean(adminToken && pathname.startsWith("/admin"));
  if (!isAdminSession) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const activeBans = await getActiveBans(supabaseUrl, supabaseKey);

        if (activeBans.length > 0) {
          const clientIp = getClientIp(request);
          const now = new Date();

          // IP Check (<0.01ms memory scan)
          let activeBan = activeBans.find(
            (b) =>
              b.type === "IP" &&
              (!b.expiresAt || new Date(b.expiresAt) > now) &&
              (b.target === clientIp ||
                (b.target.includes("/") && isIpInCidr(clientIp, b.target)))
          );

          // User Check (<0.01ms JWT memory scan, only if USER bans exist)
          if (!activeBan && activeBans.some((b) => b.type === "USER")) {
            const userPayload = extractSupabaseUser(request);
            if (userPayload) {
              activeBan = activeBans.find(
                (b) =>
                  b.type === "USER" &&
                  (!b.expiresAt || new Date(b.expiresAt) > now) &&
                  ((userPayload.id &&
                    (b.target === userPayload.id ||
                      b.targetUserId === userPayload.id)) ||
                    (userPayload.email &&
                      (b.target.toLowerCase() === userPayload.email ||
                        b.targetEmail?.toLowerCase() === userPayload.email)))
              );
            }
          }

          if (activeBan) {
            if (pathname.startsWith("/api/")) {
              return applySecurityHeaders(
                NextResponse.json(
                  {
                    error: "Access Denied",
                    message:
                      "Your IP address or user account has been suspended.",
                    reason: activeBan.reason,
                    banId: activeBan.id,
                  },
                  { status: 403 }
                )
              );
            }

            const bannedUrl = new URL("/banned", request.url);
            bannedUrl.searchParams.set("reason", activeBan.reason);
            bannedUrl.searchParams.set("id", activeBan.id);
            return NextResponse.redirect(bannedUrl);
          }
        }
      }
    } catch (banErr) {
      // Failsafe: Never block normal traffic if ban check encounters an error
      console.warn("Proxy ban enforcement check error:", banErr);
    }
  }

  // 5. Customer Session Management (Supabase)
  // Only execute session update when Supabase cookies actually exist
  const cookies = request.cookies.getAll();
  const hasSupabaseSession = cookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );

  let response: NextResponse;
  if (hasSupabaseSession && !isAdminPath) {
    response = await updateSession(request);
  } else {
    response = NextResponse.next({ request });
  }

  // 6. Customer Protected Route Validation (e.g. /account)
  if (isCustomerAuthPath) {
    if (!hasSupabaseSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, manifest.json
     * - /img_content/, /icons/
     * - static file extensions (svg, png, jpg, jpeg, gif, webp, ico, mjs, css, js, map, woff, woff2, ttf)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.json|img_content/|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mjs|css|js|map|woff|woff2|ttf)$).*)",
  ],
};
