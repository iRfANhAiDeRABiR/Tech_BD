import { NextResponse } from "next/server";
import { answerTelegramCallbackQuery, updateTelegramMessageStatus } from "@/lib/telegram";
import { processTelegramOrderAction } from "@/lib/orderVerificationService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cb = body?.callback_query;

    if (!cb || !cb.data) {
      return NextResponse.json({ ok: true, ignored: "No callback_query" });
    }

    // Security Authorization: Verify that callback query is from authorized Telegram Admin
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    const senderId = String(cb.from?.id ?? "");
    const chatId = String(cb.message?.chat?.id ?? "");

    if (adminChatId && senderId !== adminChatId && chatId !== adminChatId) {
      console.warn(`[Security Alert] Unauthorized Telegram webhook callback attempt from sender: ${senderId}, chat: ${chatId}`);
      return NextResponse.json({ error: "Forbidden: Unauthorized Telegram sender" }, { status: 403 });
    }

    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secretToken) {
      const headerToken = request.headers.get("x-telegram-bot-api-secret-token");
      if (headerToken !== secretToken) {
        return NextResponse.json({ error: "Forbidden: Invalid secret token" }, { status: 403 });
      }
    }

    const dataStr = String(cb.data).trim();
    let action: "CONFIRMED" | "INVALID" | "DONE" | null = null;
    let orderNumber: string | null = null;

    if (dataStr.startsWith("confirm_")) {
      action = "CONFIRMED";
      orderNumber = dataStr.replace(/^confirm_/, "");
    } else if (dataStr.startsWith("invalid_")) {
      action = "INVALID";
      orderNumber = dataStr.replace(/^invalid_/, "");
    } else if (
      dataStr.startsWith("done_") ||
      dataStr.startsWith("confirmed_done_") ||
      dataStr.startsWith("invalid_done_")
    ) {
      action = "DONE";
      orderNumber = dataStr.replace(/^(done|confirmed_done|invalid_done)_/, "");
    }

    if (!action || !orderNumber) {
      return NextResponse.json({ ok: true, ignored: "Unknown action" });
    }

    const adminName = cb.from?.username ? `@${cb.from.username}` : cb.from?.first_name || "Admin";

    if (action === "DONE") {
      await answerTelegramCallbackQuery(cb.id, `Order #${orderNumber} has already been processed.`);
      return NextResponse.json({ ok: true, action: "DONE", orderNumber });
    }

    // Update order in Prisma & dispatch customer email notification
    await processTelegramOrderAction({
      orderNumber,
      action,
    });

    // Answer Telegram callback query
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
