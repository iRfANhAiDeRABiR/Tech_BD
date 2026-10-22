import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

// Server-only route: Resolves username/phone -> email for secure login.
// Rate-limited and requires valid password verification to prevent user enumeration.

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`auth-login:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again shortly." },
      { status: 429 }
    );
  }

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
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
          profileByUsername.id
        );
        if (userData?.user?.email) {
          email = userData.user.email;
        }
      }

      // 3. If not username, try resolving as phone
      if (!email) {
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
    if (!email) {
      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 401 }
      );
    }

    // 4. Verify password against Supabase Auth before returning
    if (supabaseAnonKey) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.user) {
        return NextResponse.json(
          { error: "Invalid login credentials." },
          { status: 401 }
        );
      }
    }

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
