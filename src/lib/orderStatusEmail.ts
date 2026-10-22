import nodemailer from "nodemailer";
import {
  type ConfirmationItem,
  getMailConfig,
  shouldAllowSelfSignedSmtpCertificate,
  formatCurrency,
  escapeHtml,
  buildProductImageAssets,
} from "./orderConfirmationEmail";

export type OrderStatusAction = "CONFIRMED" | "INVALID";

export interface OrderStatusEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  items: Array<{
    productName: string;
    productOptionName?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product?: {
      image?: string | null;
    } | null;
  }>;
  payment?: {
    method?: string | null;
    transactionId?: string | null;
    senderNumber?: string | null;
    paymentNumber?: string | null;
    amount?: number | null;
    status?: string | null;
    verifiedAt?: Date | null;
  } | null;
}

export interface SendOrderStatusEmailInput {
  order: OrderStatusEmailData;
  action: OrderStatusAction;
  siteUrl?: string;
}

export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return "Mobile Banking";
  const m = method.toUpperCase();
  if (m === "BKASH") return "bKash";
  if (m === "NAGAD") return "Nagad";
  if (m === "ROCKET") return "Rocket";
  if (m === "UPAY") return "Upay";
  if (m === "BANK_TRANSFER") return "Bank Transfer";
  return method;
}

function buildStatusPlainText(input: SendOrderStatusEmailInput): string {
  const { order, action } = input;
  const isConfirm = action === "CONFIRMED";
  const paymentMethod = formatPaymentMethod(order.payment?.method);
  const trxId = order.payment?.transactionId || "N/A";
  const senderNumber = order.payment?.senderNumber || "N/A";

  const itemsList = order.items
    .map(
      (item) =>
        `- ${item.productName}${item.productOptionName ? ` (${item.productOptionName})` : ""} x${item.quantity} = ${formatCurrency(
          item.lineTotal || item.unitPrice * item.quantity,
        )}`,
    )
    .join("\n");

  if (isConfirm) {
    return `Hi ${order.customerName},

Great news! Your payment has been verified and your order is confirmed.

Order ID: #${order.orderNumber}
Payment Status: Verified & Approved
Payment Method: ${paymentMethod}
Transaction ID: ${trxId}
Sender Number: ${senderNumber}
Delivery Email: ${order.customerEmail}
Phone: ${order.customerPhone || "N/A"}

Ordered Items:
${itemsList}

Subtotal: ${formatCurrency(order.subtotal)}
${order.discount > 0 ? `Discount: -${formatCurrency(order.discount)}\n` : ""}Total Paid: ${formatCurrency(order.total)}

Delivery & Next Steps:
Your digital license key(s) or digital product delivery details are being processed and will be delivered to your email shortly.

If you have any questions, you can reply directly to this email with your Order Reference.

Best regards`;
  }

  return `Hi ${order.customerName},

Payment Verification Notice for Order #${order.orderNumber}.

We were unable to verify the Transaction ID submitted for your order.

Order ID: #${order.orderNumber}
Payment Status: Verification Failed (Invalid TrxID)
Payment Gateway: ${paymentMethod}
Submitted TrxID: ${trxId}
Submitted Sender: ${senderNumber}
Total Payable: ${formatCurrency(order.total)}
Delivery Email: ${order.customerEmail}

Ordered Items:
${itemsList}

The Transaction ID (${trxId}) you provided could not be matched with our ${paymentMethod} merchant account records.

How to resolve this:
1. Check your ${paymentMethod} transaction SMS or mobile statement for the exact Transaction ID.
2. If you have already sent the payment, please reply directly to this email with your correct Transaction ID and payment screenshot.
3. Quote your Order ID #${order.orderNumber} in your reply so we can immediately verify and confirm your order.

Best regards`;
}

function buildStatusHtml(
  input: SendOrderStatusEmailInput,
  imageSources: Map<number, string>,
): string {
  const { order, action } = input;
  const isConfirm = action === "CONFIRMED";
  const paymentMethod = formatPaymentMethod(order.payment?.method);
  const trxId = order.payment?.transactionId || "N/A";
  const senderNumber = order.payment?.senderNumber || "N/A";
  const nowFormatted = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date());

  const rows = order.items
    .map((item, index) => {
      const itemName = `${escapeHtml(item.productName)}${
        item.productOptionName
          ? ` <span style="color:#64748b; font-size:12px; font-weight:normal;">(${escapeHtml(item.productOptionName)})</span>`
          : ""
      }`;
      const imageUrl = imageSources.get(index);
      const imageMarkup = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.productName)}" width="48" height="48" style="display:block; width:48px; height:48px; max-width:48px; max-height:48px; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0; background:#ffffff;" />`
        : `<div style="width:48px; height:48px; border-radius:6px; border:1px solid #e2e8f0; background:#f8fafc; color:#94a3b8; font-size:10px; line-height:48px; text-align:center;">Item</div>`;

      const lineTotal = item.lineTotal || item.unitPrice * item.quantity;

      return `<tr>
        <td width="56" style="width:56px; padding:10px 8px 10px 0; vertical-align:middle;">
          ${imageMarkup}
        </td>
        <td style="padding:10px 8px; vertical-align:middle;">
          <div style="font-size:13px; font-weight:700; color:#0f172a; line-height:1.35; margin-bottom:3px; word-break:break-word;">
            ${itemName}
          </div>
          <div style="font-size:12px; color:#64748b;">
            Qty: <strong style="color:#0f172a;">${item.quantity}</strong>
          </div>
        </td>
        <td width="90" style="width:90px; padding:10px 0 10px 8px; text-align:right; vertical-align:middle; white-space:nowrap;">
          <span style="font-size:14px; font-weight:800; color:#0f172a;">${formatCurrency(lineTotal)}</span>
        </td>
      </tr>`;
    })
    .join("");

  const headerGradient = isConfirm
    ? "linear-gradient(135deg, #059669 0%, #0284c7 100%)"
    : "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)";

  const headerTitle = isConfirm
    ? "Payment Verified &amp; Order Confirmed"
    : "Payment Verification Notice";

  const headerSubtitle = isConfirm
    ? `Great news, ${escapeHtml(order.customerName)}! Your payment has been verified successfully.`
    : `Action required for Order #${escapeHtml(order.orderNumber)}`;

  const alertBox = isConfirm
    ? `<div style="background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:14px 16px; margin-bottom:20px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size:14px; font-weight:750; color:#166534;">
              ✅ Payment Status: Verified &amp; Confirmed
            </td>
          </tr>
          <tr>
            <td style="font-size:13px; color:#15803d; padding-top:4px; line-height:1.4;">
              We have received and approved your payment of <strong>${formatCurrency(order.total)}</strong>. Your order is confirmed and is now being fulfilled.
            </td>
          </tr>
        </table>
      </div>`
    : `<div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:10px; padding:14px 16px; margin-bottom:20px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size:14px; font-weight:750; color:#991b1b;">
              ❌ Payment Status: Verification Failed (ভুল TrxID)
            </td>
          </tr>
          <tr>
            <td style="font-size:13px; color:#b91c1c; padding-top:4px; line-height:1.4;">
              The Transaction ID (<strong>${escapeHtml(trxId)}</strong>) provided could not be verified in our ${escapeHtml(paymentMethod)} merchant statement.
            </td>
          </tr>
        </table>
      </div>`;

  const statusPill = isConfirm
    ? `<span style="display:inline-block; padding:2px 8px; border-radius:99px; background:#dcfce7; border:1px solid #86efac; color:#15803d; font-size:11px; font-weight:750;">Verified &amp; Approved</span>`
    : `<span style="display:inline-block; padding:2px 8px; border-radius:99px; background:#fee2e2; border:1px solid #fca5a5; color:#991b1b; font-size:11px; font-weight:750;">Invalid TrxID</span>`;

  const actionBox = isConfirm
    ? `<div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:16px; margin-top:20px;">
        <div style="font-size:14px; font-weight:750; color:#1e40af; margin-bottom:4px;">
          📦 Delivery &amp; Next Steps
        </div>
        <div style="font-size:13px; color:#1e3a8a; line-height:1.5;">
          Your digital license key(s) or digital product delivery details are being processed and will be sent to this email address (<strong>${escapeHtml(order.customerEmail)}</strong>) shortly.
        </div>
      </div>`
    : `<div style="background:#fffbeb; border:1px solid #fcd34d; border-radius:10px; padding:16px; margin-top:20px;">
        <div style="font-size:14px; font-weight:750; color:#92400e; margin-bottom:6px;">
          ⚠️ How to complete your verification:
        </div>
        <ol style="margin:0; padding-left:18px; font-size:13px; color:#78350f; line-height:1.6;">
          <li style="margin-bottom:4px;">
            Check your <strong>${escapeHtml(paymentMethod)}</strong> statement or SMS for the correct Transaction ID.
          </li>
          <li style="margin-bottom:4px;">
            If you already sent the money, <strong>reply directly to this email</strong> with your correct Transaction ID and a payment screenshot.
          </li>
          <li>
            Include Order Reference <strong>#${escapeHtml(order.orderNumber)}</strong> in your reply so we can confirm your order immediately.
          </li>
        </ol>
      </div>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
    <title>${escapeHtml(headerTitle)}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .email-container { width: 100% !important; padding: 12px 8px !important; }
        .email-card { border-radius: 12px !important; }
        .email-header { padding: 22px 16px !important; }
        .email-body { padding: 18px 14px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; -webkit-font-smoothing:antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;">
      <tr>
        <td align="center" style="padding:24px 12px;" class="email-container">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);" class="email-card">
            <!-- Header Banner -->
            <tr>
              <td style="background:${headerGradient}; padding:28px 24px; color:#ffffff;" class="email-header">
                <h1 style="margin:0; font-size:22px; font-weight:800; line-height:1.25; color:#ffffff;">
                  ${headerTitle}
                </h1>
                <p style="margin:8px 0 0; font-size:13px; opacity:0.95; line-height:1.4; color:#ffffff;">
                  ${escapeHtml(headerSubtitle)}
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:24px 20px;" class="email-body">
                ${alertBox}

                <!-- Order Details Summary Card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Order Reference:</td>
                          <td style="font-size:13px; font-family:monospace; font-weight:750; color:#0f172a; padding:3px 0; text-align:right;">#${escapeHtml(order.orderNumber)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Payment Method:</td>
                          <td style="font-size:13px; font-weight:600; color:#0f172a; padding:3px 0; text-align:right;">${escapeHtml(paymentMethod)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Transaction ID:</td>
                          <td style="font-size:13px; font-family:monospace; font-weight:700; color:#0f172a; padding:3px 0; text-align:right;">${escapeHtml(trxId)}</td>
                        </tr>
                        ${
                          senderNumber !== "N/A"
                            ? `<tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Sender Number:</td>
                          <td style="font-size:13px; font-family:monospace; font-weight:600; color:#0f172a; padding:3px 0; text-align:right;">${escapeHtml(senderNumber)}</td>
                        </tr>`
                            : ""
                        }
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Delivery Email:</td>
                          <td style="font-size:13px; font-weight:600; color:#0f172a; padding:3px 0; text-align:right; word-break:break-all;">${escapeHtml(order.customerEmail)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Status:</td>
                          <td style="padding:3px 0; text-align:right;">${statusPill}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Date &amp; Time:</td>
                          <td style="font-size:12px; color:#64748b; padding:3px 0; text-align:right;">${nowFormatted}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Products Table -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; margin-top:8px;">
                  <thead>
                    <tr style="border-bottom:2px solid #e2e8f0;">
                      <th style="padding:8px 6px 8px 0; text-align:left; font-size:11px; font-weight:750; text-transform:uppercase; letter-spacing:0.04em; color:#64748b;" colspan="2">Product</th>
                      <th style="padding:8px 0 8px 8px; text-align:right; font-size:11px; font-weight:750; text-transform:uppercase; letter-spacing:0.04em; color:#64748b;">Total</th>
                    </tr>
                  </thead>
                  <tbody style="border-bottom:1px solid #e2e8f0;">
                    ${rows}
                  </tbody>
                </table>

                <!-- Totals Section -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:12px; border-collapse:collapse;">
                  <tr>
                    <td style="padding:5px 0; font-size:13px; color:#64748b;">Subtotal:</td>
                    <td style="padding:5px 0; text-align:right; font-size:13px; font-weight:600; color:#0f172a; white-space:nowrap;">${formatCurrency(order.subtotal)}</td>
                  </tr>
                  ${
                    order.discount > 0
                      ? `<tr>
                    <td style="padding:5px 0; font-size:13px; color:#10b981;">Discount:</td>
                    <td style="padding:5px 0; text-align:right; font-size:13px; font-weight:600; color:#10b981; white-space:nowrap;">-${formatCurrency(order.discount)}</td>
                  </tr>`
                      : ""
                  }
                  <tr>
                    <td style="padding:10px 0 4px; font-size:15px; font-weight:800; color:#0f172a; border-top:1px solid #e2e8f0;">${isConfirm ? "Total Paid:" : "Total Payable:"}</td>
                    <td style="padding:10px 0 4px; text-align:right; font-size:17px; font-weight:850; color:${isConfirm ? "#059669" : "#0f172a"}; border-top:1px solid #e2e8f0; white-space:nowrap;">${formatCurrency(order.total)}</td>
                  </tr>
                </table>

                ${actionBox}

                <!-- Footer Note -->
                <div style="margin-top:24px; padding-top:16px; border-top:1px solid #f1f5f9; text-align:center;">
                  <p style="font-size:12px; color:#94a3b8; margin:0; line-height:1.5;">
                    If you have questions about your order, reply directly to this email with your Order Reference.
                  </p>
                  <p style="font-size:12px; color:#94a3b8; margin:6px 0 0;">
                    Best regards
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOrderStatusEmail(input: SendOrderStatusEmailInput) {
  const config = getMailConfig();

  if (!config) {
    console.warn("Order status email skipped: SMTP configuration is incomplete.");
    return { success: false, error: "SMTP not configured" };
  }

  if (!input.order.customerEmail) {
    console.warn(`Order #${input.order.orderNumber} has no customer email.`);
    return { success: false, error: "No customer email" };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: shouldAllowSelfSignedSmtpCertificate()
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const confirmationItems: ConfirmationItem[] = input.order.items.map((item) => ({
    productName: item.productName,
    productImage: item.product?.image || undefined,
    optionName: item.productOptionName || undefined,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));

  const imageAssets = buildProductImageAssets(confirmationItems, input.siteUrl);

  const isConfirm = input.action === "CONFIRMED";
  const subject = isConfirm
    ? `✅ Payment Verified & Order Confirmed - #${input.order.orderNumber}`
    : `❌ Payment Verification Failed (Invalid TrxID) - #${input.order.orderNumber}`;

  try {
    await transporter.sendMail({
      from: config.from,
      to: input.order.customerEmail,
      subject,
      text: buildStatusPlainText(input),
      html: buildStatusHtml(input, imageAssets.sources),
      attachments: imageAssets.attachments,
    });
    return { success: true };
  } catch (err: any) {
    console.error(`Failed to send order status email for #${input.order.orderNumber}:`, err);
    return { success: false, error: err.message };
  }
}
