import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");

  if (!ref) {
    return NextResponse.json({ status: "PENDING", error: "Missing ref parameter" }, { status: 400 });
  }

  const cleanRef = ref.trim();

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: cleanRef },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ status: "PENDING", refId: cleanRef });
    }

    const paymentStatus = order.payment?.status;
    const orderStatus = order.status;

    if (paymentStatus === "VERIFIED" || orderStatus === "COMPLETED") {
      return NextResponse.json({
        status: "CONFIRMED",
        refId: order.orderNumber,
        total: order.total,
      });
    }

    if (paymentStatus === "REJECTED" || orderStatus === "CANCELLED") {
      return NextResponse.json({
        status: "INVALID",
        refId: order.orderNumber,
        total: order.total,
      });
    }

    // Fallback: Check Telegram getUpdates if webhook wasn't registered
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      try {
        const teleRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
        const teleData = await teleRes.json();
        if (teleData.ok && Array.isArray(teleData.result)) {
          for (let i = teleData.result.length - 1; i >= 0; i--) {
            const item = teleData.result[i];
            const cb = item.callback_query;
            if (!cb || !cb.data) continue;

            const dataStr = String(cb.data);
            if (dataStr === `confirm_${cleanRef}`) {
              await prisma.order.update({
                where: { orderNumber: cleanRef },
                data: {
                  status: "COMPLETED",
                  payment: { update: { status: "VERIFIED" } },
                },
              });
              return NextResponse.json({ status: "CONFIRMED", refId: cleanRef });
            } else if (dataStr === `invalid_${cleanRef}`) {
              await prisma.order.update({
                where: { orderNumber: cleanRef },
                data: {
                  payment: { update: { status: "REJECTED" } },
                },
              });
              return NextResponse.json({ status: "INVALID", refId: cleanRef });
            }
          }
        }
      } catch (e) {
        // Fallback silently to pending
      }
    }

    return NextResponse.json({ status: "PENDING", refId: cleanRef });
  } catch (err: any) {
    return NextResponse.json({ status: "PENDING", error: err.message }, { status: 500 });
  }
}

