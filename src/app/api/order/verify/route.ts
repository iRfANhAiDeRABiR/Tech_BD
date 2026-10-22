import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { answerTelegramCallbackQuery, updateTelegramMessageStatus } from "@/lib/telegram";
import { processTelegramOrderAction } from "@/lib/orderVerificationService";

export const runtime = "nodejs";

async function syncTelegramUpdates() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    const teleRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const teleData = await teleRes.json();
    if (!teleData.ok || !Array.isArray(teleData.result) || teleData.result.length === 0) {
      return;
    }

    for (const item of teleData.result) {
      const cb = item.callback_query;
      if (cb && cb.data) {
        const dataStr = String(cb.data).trim();
        let action: "CONFIRMED" | "INVALID" | "DONE" | null = null;
        let orderRef: string | null = null;

        if (dataStr.startsWith("confirm_")) {
          action = "CONFIRMED";
          orderRef = dataStr.replace(/^confirm_/, "");
        } else if (dataStr.startsWith("invalid_")) {
          action = "INVALID";
          orderRef = dataStr.replace(/^invalid_/, "");
        } else if (
          dataStr.startsWith("done_") ||
          dataStr.startsWith("confirmed_done_") ||
          dataStr.startsWith("invalid_done_")
        ) {
          action = "DONE";
          orderRef = dataStr.replace(/^(done|confirmed_done|invalid_done)_/, "");
        }

        if (orderRef) {
          const adminName = cb.from?.username ? `@${cb.from.username}` : cb.from?.first_name || "Admin";

          if (action === "DONE") {
            await answerTelegramCallbackQuery(cb.id, `Order #${orderRef} has already been processed.`);
          } else if (action === "CONFIRMED" || action === "INVALID") {
            // Update DB & send customer status email
            await processTelegramOrderAction({ orderNumber: orderRef, action });

            await answerTelegramCallbackQuery(
              cb.id,
              action === "CONFIRMED"
                ? `✅ Order #${orderRef} Confirmed by ${adminName}!`
                : `❌ Order #${orderRef} marked as Invalid by ${adminName}!`
            );

            if (cb.message?.chat?.id && cb.message?.message_id) {
              await updateTelegramMessageStatus({
                chatId: cb.message.chat.id,
                messageId: cb.message.message_id,
                orderNumber: orderRef,
                action,
                adminName,
                originalText: cb.message.text,
              });
            }
          }
        }
      }

      // Acknowledge update offset to Telegram so it doesn't stay in queue
      await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${item.update_id + 1}`).catch(() => {});
    }
  } catch (err) {
    console.error("Error syncing Telegram updates:", err);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");

  if (!ref) {
    return NextResponse.json({ status: "PENDING", error: "Missing ref parameter" }, { status: 400 });
  }

  const cleanRef = ref.trim();

  // 1. Process any pending button clicks from Telegram first
  await syncTelegramUpdates();

  // 2. Query the updated order status from database
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

    return NextResponse.json({ status: "PENDING", refId: cleanRef });
  } catch (err: any) {
    return NextResponse.json({ status: "PENDING", error: err.message }, { status: 500 });
  }
}
