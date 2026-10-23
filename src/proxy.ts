import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// Paths that require admin authentication
const ADMIN_PATHS = ["/admin", "/api/admin"];
// Paths that should not be accessible if already authenticated (e.g., login page)
const AUTH_PATHS = ["/admin/login"];
// Paths that require customer authentication (Supabase)
const CUSTOMER_AUTH_PATHS = ["/account"];

function getClientIp(request: NextRequest): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return "127.0.0.1";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle Supabase Session Refreshing (Customer Auth)
  // This must run early to ensure cookies are updated before any redirects.
  // Note: updateSession returns a new NextResponse with updated cookies.
  const supabaseResponse = await updateSession(request);

  // Security Headers for all responses
  const response = supabaseResponse;
  
  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Clickjacking protection
  response.headers.set("X-Frame-Options", "DENY");
  // Referrer policy to prevent leakage
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy (restrict sensitive APIs)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );
  
  // HSTS (only if HTTPS is guaranteed in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Skip proxy for static assets, api routes (except auth), banned page, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/banned" ||
    pathname.startsWith("/banned/") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // Check if path requires admin auth
  const isAuthPath = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAdminPath =
    !isAuthPath && ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const isCustomerAuthPath = CUSTOMER_AUTH_PATHS.some((p) =>
    pathname.startsWith(p)
  );

  // --- ADMIN AUTHENTICATION (NextAuth) ---
  const isSecure = request.nextUrl.protocol === "https:";
  const adminToken = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: isSecure,
  });

  if (isAdminPath && !adminToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect unauthenticated users to admin login
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && adminToken) {
    // Redirect authenticated admins away from login page
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // --- ACCESS BAN ENFORCEMENT (IP & USER) ---
  // Authenticated admins accessing /admin are exempt to prevent admin lockout
  const isAdminSession = Boolean(adminToken && pathname.startsWith("/admin"));
  if (!isAdminSession) {
    try {
      const clientIp = getClientIp(request);
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

      // Check for active IP ban
      const { data: ipBans } = await supabase
        .from("AccessBan")
        .select("id, type, target, reason, expiresAt")
        .eq("isActive", true)
        .eq("type", "IP")
        .eq("target", clientIp)
        .limit(1);

      let activeBan = ipBans && ipBans.length > 0 ? ipBans[0] : null;

      // If not IP banned, check if customer user session is banned
      if (!activeBan) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const userFilters: string[] = [];
          if (user.id) {
            userFilters.push(`target.eq.${user.id}`, `targetUserId.eq.${user.id}`);
          }
          if (user.email) {
            userFilters.push(`target.eq.${user.email}`, `targetEmail.eq.${user.email}`);
          }

          if (userFilters.length > 0) {
            const { data: userBans } = await supabase
              .from("AccessBan")
              .select("id, type, target, reason, expiresAt")
              .eq("isActive", true)
              .eq("type", "USER")
              .or(userFilters.join(","))
              .limit(1);

            if (userBans && userBans.length > 0) {
              activeBan = userBans[0];
            }
          }
        }
      }

      if (activeBan) {
        const isExpired =
          activeBan.expiresAt && new Date(activeBan.expiresAt) <= new Date();

        if (!isExpired) {
          // If API route, return 403 JSON
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              {
                error: "Access Denied",
                message: "Your IP address or user account has been suspended.",
                reason: activeBan.reason,
                banId: activeBan.id,
              },
              { status: 403 }
            );
          }

          // If Page route, redirect to /banned
          const bannedUrl = new URL("/banned", request.url);
          bannedUrl.searchParams.set("reason", activeBan.reason);
          bannedUrl.searchParams.set("id", activeBan.id);
          return NextResponse.redirect(bannedUrl);
        }
      }
    } catch (banErr) {
      // Failsafe: Never block normal traffic if ban check encounters an error
      console.warn("Proxy ban enforcement check error:", banErr);
    }
  }

  // --- CUSTOMER AUTHENTICATION (Supabase) ---
  // For customer routes, we properly validate the session using the Supabase server client.
  if (isCustomerAuthPath) {
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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirect unauthenticated users to home where the auth modal can be opened
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
