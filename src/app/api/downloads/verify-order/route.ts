import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawOrderId = typeof body.orderId === "string" ? body.orderId.trim() : "";

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

      const isConfirmed =
        order.status === "COMPLETED" ||
        order.status === "PAID" ||
        order.payment?.status === "VERIFIED";

      if (isConfirmed) {
        return NextResponse.json({
          success: true,
          valid: true,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
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
