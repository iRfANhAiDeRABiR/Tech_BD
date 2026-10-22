import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { answerTelegramCallbackQuery, updateTelegramMessageStatus } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cb = body?.callback_query;

    if (!cb || !cb.data) {
      return NextResponse.json({ ok: true, ignored: "No callback_query" });
    }

    const dataStr = String(cb.data).trim();
    let action: "CONFIRMED" | "INVALID" | null = null;
    let orderNumber: string | null = null;

    if (dataStr.startsWith("confirm_")) {
      action = "CONFIRMED";
      orderNumber = dataStr.replace(/^confirm_/, "");
    } else if (dataStr.startsWith("invalid_")) {
      action = "INVALID";
      orderNumber = dataStr.replace(/^invalid_/, "");
    }

    if (!action || !orderNumber) {
      return NextResponse.json({ ok: true, ignored: "Unknown action" });
    }

    // Update order in Prisma
    if (action === "CONFIRMED") {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          status: "COMPLETED",
          payment: {
            update: { status: "VERIFIED" },
          },
        },
      });
    } else {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          payment: {
            update: { status: "REJECTED" },
          },
        },
      });
    }

    // Answer Telegram callback query
    const adminName = cb.from?.username ? `@${cb.from.username}` : cb.from?.first_name || "Admin";
    await answerTelegramCallbackQuery(
      cb.id,
      action === "CONFIRMED"
        ? `✅ Order #${orderNumber} Confirmed by ${adminName}!`
        : `❌ Order #${orderNumber} marked as Invalid by ${adminName}!`
    );

    // Update message text & keyboard in Telegram
    if (cb.message?.chat?.id && cb.message?.message_id) {
      await updateTelegramMessageStatus({
        chatId: cb.message.chat.id,
        messageId: cb.message.message_id,
        orderNumber,
        action,
        adminName,
        originalText: cb.message.text,
      });
    }

    return NextResponse.json({ ok: true, action, orderNumber });
  } catch (err: any) {
    console.error("Error in telegram webhook", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
