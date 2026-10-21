import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

// Server-only route: Checks if phone is already registered.
// Email uniqueness is enforced by Supabase Auth natively during signUp.
// Uses service role key for secure lookups without exposing user data.

export async function POST(request: Request) {
  // Rate limit to prevent phone-enumeration abuse of this public endpoint.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`check-availability:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null || !("phone" in body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { phone } = body as { phone?: unknown };
    if (typeof phone !== "string" || phone.length > 30) {
      return NextResponse.json(
        { error: "Please provide a valid phone number." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase server environment variables.");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // Use service role for secure lookups
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const result: { phoneTaken?: boolean } = {};

    // Check phone in profiles table
    if (phone) {
      const normalizedPhone = normalizePhone(phone);

      if (normalizedPhone) {
        const { data: profileByPhone, error: phoneError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("phone_e164", normalizedPhone)
          .maybeSingle();

        if (phoneError) {
          console.error("Error checking phone:", phoneError);
          return NextResponse.json(
            { error: "Unable to verify phone availability." },
            { status: 500 }
          );
        }

        result.phoneTaken = !!profileByPhone;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check availability error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

function normalizePhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("880") && cleaned.length === 13) return "+" + cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 11)
    return "+880" + cleaned.slice(1);
  if (cleaned.length >= 10) return "+" + cleaned;
  return "";
}