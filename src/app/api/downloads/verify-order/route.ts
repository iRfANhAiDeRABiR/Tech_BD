import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logAdminEvent } from "@/lib/audit-logs-store";
import { extractClientIp } from "@/lib/ip-utils";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

function maskCustomerName(name: string | null | undefined): string {
  if (!name) return "Valued Customer";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => {
      if (p.length <= 2) return `${p[0]}*`;
      return `${p[0]}${"*".repeat(Math.min(p.length - 2, 4))}${p[p.length - 1]}`;
    })
    .join(" ");
}

export async function POST(request: Request) {
  try {
    const clientIp = extractClientIp(request.headers);

    // Rate limit verification queries to protect against brute-force enumeration
    if (!rateLimit(`download-verify:${clientIp}`, 10, 60_000)) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: "খুব বেশি যাচাই করার চেষ্টা করা হয়েছে। অনুগ্রহ করে ১ মিনিট পর আবার চেষ্টা করুন।",
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawOrderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const rawContact =
      typeof body.contact === "string"
        ? body.contact.trim()
        : typeof body.phoneOrEmail === "string"
        ? body.phoneOrEmail.trim()
        : "";

    // 1. If an explicit order ID is submitted
    if (rawOrderId) {
      const cleanId = rawOrderId.replace(/^#+/, "").trim();

      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: { equals: cleanId, mode: "insensitive" } },
            { id: { equals: cleanId, mode: "insensitive" } },
          ],
        },
        include: {
          payment: true,
          items: {
            select: {
              productName: true,
              productOptionName: true,
            },
          },
        },
      });

      if (!order) {
        void logAdminEvent({
          action: "DOWNLOAD_VERIFY_FAILED",
          category: "SECURITY",
          entityType: "SoftwareDownload",
          entityName: rawOrderId,
          ipAddress: clientIp,
          details: { attemptedId: rawOrderId, reason: "NOT_FOUND" },
          severity: "WARNING",
        });

        return NextResponse.json(
          {
            success: false,
            valid: false,
            reason: "NOT_FOUND",
            message: "এই অর্ডার নম্বরটি পাওয়া যায়নি। অনুগ্রহ করে সঠিক অর্ডার আইডি লিখুন (যেমন: TECHBD-ATD-XXXXXX)।",
          },
          { status: 404 }
        );
      }

      // If contact verification is provided, ensure phone or email matches
      if (rawContact) {
        const cleanContact = rawContact.toLowerCase();
        const dbEmail = (order.customerEmail || "").toLowerCase();
        const dbPhoneDigits = (order.customerPhone || "").replace(/\D/g, "");
        const inputDigits = rawContact.replace(/\D/g, "");

        const emailMatches = Boolean(dbEmail && dbEmail === cleanContact);
        const phoneMatches = Boolean(
          inputDigits &&
            dbPhoneDigits &&
            (dbPhoneDigits.endsWith(inputDigits.slice(-8)) || inputDigits.endsWith(dbPhoneDigits.slice(-8)))
        );

        if (!emailMatches && !phoneMatches) {
          return NextResponse.json(
            {
              success: false,
              valid: false,
              reason: "CONTACT_MISMATCH",
              message: "প্রদত্ত ফোন নম্বর বা ইমেইলের সাথে এই অর্ডারের তথ্য মিলছে না।",
            },
            { status: 403 }
          );
        }
      }

      const isConfirmed =
        order.status === "COMPLETED" ||
        order.status === "PAID" ||
        order.payment?.status === "VERIFIED";

      if (isConfirmed) {
        return NextResponse.json({
          success: true,
          valid: true,
          orderNumber: order.orderNumber,
          customerName: maskCustomerName(order.customerName),
          status: "CONFIRMED",
          message: "অর্ডার ভেরিফিকেশন সফল হয়েছে! ডাউনলোড লিঙ্ক আনলক করা হয়েছে।",
        });
      }

      if (
        order.status === "CANCELLED" ||
        order.status === "REFUNDED" ||
        order.payment?.status === "REJECTED"
      ) {
        return NextResponse.json({
          success: false,
          valid: false,
          reason: "CANCELLED",
          orderNumber: order.orderNumber,
          message: "এই অর্ডারটি বাতিল বা রিফান্ড করা হয়েছে। নতুন লাইসেন্স নিতে আমাদের স্টোর ভিজিট করুন।",
        });
      }

      // If pending payment/verification
      return NextResponse.json({
        success: false,
        valid: false,
        reason: "PENDING",
        orderNumber: order.orderNumber,
        message: "আপনার অর্ডারটি এখনও পেমেন্ট ভেরিফিকেশন বা পেন্ডিং অবস্থায় আছে। পেমেন্ট কনফার্ম হলে ডাউনলোড সক্রিয় হবে।",
      });
    }

    // 2. If no orderId is passed, check logged-in user's order history
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({
        success: false,
        valid: false,
        reason: "NOT_LOGGED_IN",
        message: "লগইন করা নেই এবং কোনো অর্ডার আইডি দেওয়া হয়নি।",
      });
    }

    const confirmedOrder = await prisma.order.findFirst({
      where: {
        customerEmail: { equals: user.email, mode: "insensitive" },
        OR: [
          { status: { in: ["COMPLETED", "PAID"] } },
          { payment: { status: "VERIFIED" } },
        ],
      },
      select: { id: true, orderNumber: true, customerName: true },
      orderBy: { createdAt: "desc" },
    });

    if (confirmedOrder) {
      return NextResponse.json({
        success: true,
        valid: true,
        userLoggedIn: true,
        orderNumber: confirmedOrder.orderNumber,
        customerName: confirmedOrder.customerName,
        status: "CONFIRMED",
        message: "আপনার একাউন্টে কনফার্মড অর্ডার পাওয়া গেছে। ডাউনলোড সক্রিয়।",
      });
    }

    return NextResponse.json({
      success: false,
      valid: false,
      userLoggedIn: true,
      reason: "NO_CONFIRMED_ORDERS",
      message: "আপনার একাউন্টে কোনো কনফার্মড অর্ডার পাওয়া যায়নি। অনুগ্রহ করে আপনার অর্ডার আইডি প্রদান করুন।",
    });
  } catch (error: any) {
    console.error("Order download verify error:", error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: "অর্ডার যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      },
      { status: 500 }
    );
  }
}
