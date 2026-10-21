import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { sendNewsletterWelcomeEmail } from "@/lib/newsletterEmail";

export const runtime = "nodejs";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(200).toLowerCase(),
});

export async function POST(request: Request) {
  // Abuse protection on this public endpoint.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`newsletter:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { message: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const email = parsed.data.email;

    // Upsert so re-subscribing reactivates instead of failing on unique email.
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true, source: "website" },
      create: { email, isActive: true, source: "website" },
    });

    try {
      await sendNewsletterWelcomeEmail(email);
    } catch (emailError) {
      console.error("Failed to send newsletter welcome email", emailError);
      // Subscription is saved; tell the user the code will arrive later
      // rather than failing the whole request.
      return NextResponse.json({
        message:
          "You're subscribed! Your discount code is on its way to your inbox.",
      });
    }

    return NextResponse.json({
      message: "🎉 Subscribed! Check your email for your 10% off code.",
    });
  } catch (error) {
    console.error("Newsletter subscription failed", error);
    return NextResponse.json(
      { message: "Could not complete your subscription. Please try again." },
      { status: 500 },
    );
  }
}