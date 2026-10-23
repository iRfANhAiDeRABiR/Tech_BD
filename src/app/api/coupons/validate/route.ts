import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons-store";
import { rateLimit } from "@/lib/rateLimit";
import { extractClientIp } from "@/lib/ip-utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = extractClientIp(request.headers);
    if (!rateLimit(`coupon-validate:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { valid: false, message: "Too many coupon attempts. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const subtotal = Math.max(0, Number(body.subtotal) || 0);

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Please provide a coupon code." },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, subtotal);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Coupon validation error:", err);
    return NextResponse.json(
      { valid: false, message: "Could not validate coupon. Please try again." },
      { status: 500 }
    );
  }
}

