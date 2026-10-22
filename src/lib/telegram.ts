/**
 * Telegram Bot Integration for Tech Solutions BD
 * Sends real-time order alerts with inline interactive verification buttons (Confirm / Invalid).
 */

export function escapeTelegramHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface TelegramOrderNotificationPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ productName: string; quantity: number; lineTotal: number }>;
  total: number;
  discount?: number;
  couponCode?: string | null;
  paymentMethod: string;
  senderNumber: string;
  receiverNumber: string;
  transactionId: string;
  notes?: string | null;
  isReminder?: boolean;
  reminderIndex?: number;
  maxReminders?: number;
}

export async function sendTelegramOrderNotification(
  payload: TelegramOrderNotificationPayload
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram credentials (TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID) missing in environment.");
    return { success: false, error: "Telegram credentials not configured" };
  }

  const safeRefId = escapeTelegramHtml(payload.orderNumber);
  const safeName = escapeTelegramHtml(payload.customerName);
  const safeEmail = escapeTelegramHtml(payload.customerEmail);
  const safePhone = escapeTelegramHtml(payload.customerPhone);
  const safeGateway = escapeTelegramHtml(payload.paymentMethod);
  const safeSender = escapeTelegramHtml(payload.senderNumber);
  const safeTrxId = escapeTelegramHtml(payload.transactionId);
  const safeTotal = `৳ ${payload.total.toLocaleString("en-BD")}`;

  const productsList = payload.items
    .map(
      (it) =>
        `• <b>${escapeTelegramHtml(it.productName)}</b> (x${it.quantity}) - ৳${it.lineTotal.toLocaleString("en-BD")}`
    )
    .join("\n");

  const couponLine = payload.couponCode
    ? `\n🏷️ <b>Coupon:</b> <code>${escapeTelegramHtml(payload.couponCode)}</code> (-৳${(payload.discount || 0).toLocaleString("en-BD")})`
    : "";

  const notesLine = payload.notes
    ? `\n📝 <b>Notes:</b> <i>${escapeTelegramHtml(payload.notes)}</i>`
    : "";

  const headerTitle = payload.isReminder
    ? `⚠️ <b>URGENT REMINDER (#${payload.reminderIndex || 1}/${payload.maxReminders || 8})</b>\n🔔 <b>ORDER AWAITING CONFIRMATION</b>`
    : `🔔 <b>NEW TECH SOLUTIONS BD ORDER</b>`;

  const statusLine = payload.isReminder
    ? `Status: ⏳ <b>PENDING VERIFICATION (ACTION REQUIRED #${payload.reminderIndex || 1})</b>`
    : `Status: ⏳ <b>PENDING VERIFICATION</b>`;

  const messageText = `
${headerTitle}
━━━━━━━━━━━━━━━━━━━━━
📋 <b>Order Ref:</b> <code>${safeRefId}</code>
👤 <b>Customer:</b> <b>${safeName}</b>
📧 <b>Delivery Email:</b> <code>${safeEmail}</code>
📱 <b>Customer Phone:</b> <code>${safePhone}</code>
━━━━━━━━━━━━━━━━━━━━━
📦 <b>Ordered Products:</b>
${productsList}
💰 <b>Total Payable:</b> <b>${safeTotal}</b>${couponLine}${notesLine}
━━━━━━━━━━━━━━━━━━━━━
💳 <b>Payment Gateway:</b> <b>${safeGateway}</b>
📤 <b>Sender Number:</b> <code>${safeSender}</code>
🔑 <b>Transaction ID:</b> <code>${safeTrxId}</code>
⏰ <b>Time:</b> ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}
━━━━━━━━━━━━━━━━━━━━━
${statusLine}
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Confirm (বৈধ)", callback_data: `confirm_${payload.orderNumber}` },
              { text: "❌ Invalid (ভুল TrxID)", callback_data: `invalid_${payload.orderNumber}` },
            ],
          ],
        },
      }),
    });

    const data = await res.json();
    return {
      success: data.ok === true,
      messageId: data.result?.message_id,
      error: data.ok ? undefined : data.description,
    };
  } catch (err: any) {
    console.error("Failed to send order notification to Telegram", err);
    return { success: false, error: err.message };
  }
}

export async function answerTelegramCallbackQuery(callbackQueryId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: false,
      }),
    });
  } catch (e) {
    console.error("Failed to answer callback query", e);
  }
}

export async function updateTelegramMessageStatus(params: {
  chatId: number | string;
  messageId: number;
  orderNumber: string;
  action: "CONFIRMED" | "INVALID";
  adminName: string;
  originalText?: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const isConfirm = params.action === "CONFIRMED";
  const statusRemark = isConfirm
    ? `✅ <b>PAYMENT CONFIRMED</b>\n<i>Verified by ${escapeTelegramHtml(params.adminName)} at ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</i>`
    : `❌ <b>INVALID TRANSACTION ID (REJECTED)</b>\n<i>Marked by ${escapeTelegramHtml(params.adminName)} at ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</i>`;

  let updatedText = "";
  if (params.originalText) {
    const baseText = params.originalText
      .split(/Status:\s*⏳/i)[0]
      .split(/Status:\s*✅/i)[0]
      .split(/Status:\s*❌/i)[0]
      .trim();

    updatedText = `
${isConfirm ? "✅" : "❌"} <b>TECH SOLUTIONS BD ORDER — ${isConfirm ? "CONFIRMED" : "INVALID"}</b>
${baseText.replace(/^[^\n]*\n/, "")}
━━━━━━━━━━━━━━━━━━━━━
${statusRemark}
    `.trim();
  } else {
    updatedText = `
${isConfirm ? "✅" : "❌"} <b>TECH SOLUTIONS BD ORDER #${escapeTelegramHtml(params.orderNumber)} — ${isConfirm ? "CONFIRMED" : "INVALID"}</b>
━━━━━━━━━━━━━━━━━━━━━
${statusRemark}
    `.trim();
  }

  const inlineKeyboard = isConfirm
    ? [[{ text: "✅ Confirmed (অনুমোদিত)", callback_data: `done_${params.orderNumber}` }]]
    : [
        [
          { text: "❌ Invalid TrxID (বাতিল)", callback_data: `done_${params.orderNumber}` },
          { text: "🔄 পুনরায় Confirm করুন", callback_data: `confirm_${params.orderNumber}` },
        ],
      ];

  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: params.chatId,
        message_id: params.messageId,
        text: updatedText,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: inlineKeyboard },
      }),
    });
  } catch (err) {
    console.error("Failed to update telegram message status", err);
  }
}
