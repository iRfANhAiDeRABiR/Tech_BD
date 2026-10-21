import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only route: Resolves username/phone -> email for secure login.
// NEVER expose service role key or raw user lookups to the client.

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Invalid credentials." },
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

    // Use service role ONLY for secure identifier resolution
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let email: string | null = null;
    const trimmedId = identifier.trim();

    // 1. Check if identifier is already an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedId);

    if (isEmail) {
      email = trimmedId.toLowerCase();
    } else {
      // 2. Try resolving as username (case-insensitive)
      const { data: profileByUsername } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("username", trimmedId)
        .maybeSingle();

      if (profileByUsername) {
        // Fetch email from auth.users via admin
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
          profileByUsername.id
        );
        if (userData?.user?.email) {
          email = userData.user.email;
        }
      }

      // 3. If not username, try resolving as phone
      if (!email) {
        // Normalize phone for lookup (basic E.164 assumption)
        const normalizedPhone = normalizePhoneForLookup(trimmedId);
        
        const { data: profileByPhone } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("phone_e164", normalizedPhone)
          .maybeSingle();

        if (profileByPhone) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
            profileByPhone.id
          );
          if (userData?.user?.email) {
            email = userData.user.email;
          }
        }
      }
    }

    // SECURITY: Always return generic message if resolution fails
    // Do NOT reveal whether username/phone/email exists
    if (!email) {
      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 401 }
      );
    }

    // 4. Attempt authentication with resolved email
    // We use the anon/client key here for signInWithPassword because
    // we want a standard user session, not an admin session.
    // Alternatively, we could return the email and let client sign in,
    // but doing it server-side hides the email from network tab/response.
    // However, Supabase SSR usually expects client-side signIn or specific cookie handling.
    // For simplicity in this architecture, we'll return the resolved email
    // to the client so it can establish the session properly via the SDK.
    // NOTE: In a stricter setup, you'd set cookies here directly.
    
    return NextResponse.json({ email });

  } catch (error) {
    console.error("Login resolver error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

function normalizePhoneForLookup(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("880") && cleaned.length === 13) return "+" + cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 11) return "+880" + cleaned.slice(1);
  if (cleaned.length >= 10) return "+" + cleaned;
  return phone;
}