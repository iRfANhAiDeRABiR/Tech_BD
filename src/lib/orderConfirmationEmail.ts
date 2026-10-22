import nodemailer from "nodemailer";
import { existsSync } from "node:fs";
import path from "node:path";

export type ConfirmationOrder = {
  orderNumber: string;
  total: number;
};

export type ConfirmationCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type ConfirmationItem = {
  productName: string;
  productImage?: string;
  optionName?: string;
  quantity: number;
  unitPrice: number;
};

export type ConfirmationTotals = {
  subtotal: number;
  discount: number;
  total: number;
};

export type SendOrderConfirmationEmailInput = {
  order: ConfirmationOrder;
  customer: ConfirmationCustomer;
  items: ConfirmationItem[];
  totals: ConfirmationTotals;
  paymentLabel: string;
  siteUrl?: string;
};

export type ProductImageAsset = {
  sources: Map<number, string>;
  attachments: Array<{
    filename: string;
    path: string;
    cid: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function escapeHtml(value: string | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function resolveImageUrl(imageUrl: string | undefined, siteUrl: string | undefined) {
  if (!imageUrl) {
    return null;
  }

  if (/^(https?:|data:|cid:)/i.test(imageUrl)) {
    return imageUrl;
  }

  const baseUrl = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (!baseUrl) {
    return imageUrl;
  }

  return new URL(imageUrl, baseUrl).toString();
}

export function getPublicImagePath(imageUrl: string | undefined) {
  if (!imageUrl || !imageUrl.startsWith("/")) {
    return null;
  }

  const pathname = imageUrl.split(/[?#]/)[0];

  if (pathname.includes("..")) {
    return null;
  }

  const publicDirectory = path.join(process.cwd(), "public");
  const filePath = path.join(publicDirectory, pathname);

  if (!filePath.startsWith(publicDirectory) || !existsSync(filePath)) {
    return null;
  }

  return filePath;
}

export function buildProductImageAssets(
  items: ConfirmationItem[],
  siteUrl: string | undefined,
): ProductImageAsset {
  const sources = new Map<number, string>();
  const attachments: ProductImageAsset["attachments"] = [];

  items.forEach((item, index) => {
    const publicImagePath = getPublicImagePath(item.productImage);

    if (publicImagePath) {
      const cid = `product-${index}-${Date.now()}@tech-solutions-bd`;

      sources.set(index, `cid:${cid}`);
      attachments.push({
        filename: path.basename(publicImagePath),
        path: publicImagePath,
        cid,
      });
      return;
    }

    const imageUrl = resolveImageUrl(item.productImage, siteUrl);

    if (imageUrl) {
      sources.set(index, imageUrl);
    }
  });

  return { sources, attachments };
}

export function getMailConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return { host, port, secure, user, pass, from };
}

export function shouldAllowSelfSignedSmtpCertificate() {
  return process.env.SMTP_ALLOW_SELF_SIGNED === "true";
}

function buildOrderConfirmationText({
  order,
  customer,
  items,
  totals,
  paymentLabel,
}: SendOrderConfirmationEmailInput) {
  const itemLines = items
    .map((item) => {
      const option = item.optionName ? ` (${item.optionName})` : "";
      return `- ${item.productName}${option} x ${item.quantity}: ${formatCurrency(
        item.unitPrice * item.quantity,
      )}`;
    })
    .join("\n");

  return `Hi ${customer.name},

Thank you for your order.

Order ID: ${order.orderNumber}
Customer name: ${customer.name}
Customer phone: ${customer.phone}
Customer email: ${customer.email}
Payment method: ${paymentLabel}
Payment status: Submitted for verification

Items:
${itemLines}

Subtotal: ${formatCurrency(totals.subtotal)}
Discount: ${formatCurrency(totals.discount)}
Total: ${formatCurrency(totals.total)}

We have received your order and payment details. Our team will verify your payment and send your license key/product details to this email shortly.

Best regards`;
}

function buildOrderConfirmationHtml(
  {
    order,
    customer,
    items,
    totals,
    paymentLabel,
    siteUrl,
  }: SendOrderConfirmationEmailInput,
  imageSources = new Map<number, string>(),
) {
  const rows = items
    .map((item, index) => {
      const itemName = `${escapeHtml(item.productName)}${
        item.optionName
          ? ` <span style="color:#64748b; font-size:12px; font-weight:normal;">(${escapeHtml(item.optionName)})</span>`
          : ""
      }`;
      const imageUrl = imageSources.get(index) ?? resolveImageUrl(item.productImage, siteUrl);
      const imageMarkup = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.productName)}" width="48" height="48" style="display:block; width:48px; height:48px; max-width:48px; max-height:48px; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0; background:#ffffff;" />`
        : `<div style="width:48px; height:48px; border-radius:6px; border:1px solid #e2e8f0; background:#f8fafc; color:#94a3b8; font-size:10px; line-height:48px; text-align:center;">No img</div>`;

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
          <span style="font-size:14px; font-weight:800; color:#0f172a;">${formatCurrency(
            item.unitPrice * item.quantity,
          )}</span>
        </td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <meta name="x-apple-disable-message-reformatting">
    <title>Order Confirmation - #${escapeHtml(order.orderNumber)}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .outer-table { padding: 8px 4px !important; }
        .inner-card { padding: 16px 12px !important; }
        .header-pad { padding: 20px 14px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; width:100% !important; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#0f172a; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="outer-table" style="background-color:#f1f5f9; width:100%; margin:0; padding:20px 8px;">
      <tr>
        <td align="center" style="padding:0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px; width:100%; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 14px rgba(0,0,0,0.04);">
            <!-- Top Gradient Header -->
            <tr>
              <td class="header-pad" style="background:linear-gradient(135deg, #0d80e8 0%, #1e40af 100%); padding:24px 20px; color:#ffffff; text-align:left;">
                <h1 style="margin:0; font-size:22px; font-weight:800; letter-spacing:-0.02em; color:#ffffff; line-height:1.25;">Order Confirmation</h1>
                <p style="margin:6px 0 0; font-size:13px; color:#e0f2fe; opacity:0.95;">Thank you for your order. We are processing your software license.</p>
              </td>
            </tr>

            <!-- Card Content Body -->
            <tr>
              <td class="inner-card" style="padding:22px 18px;">
                <p style="font-size:15px; font-weight:700; margin:0 0 8px; color:#0f172a;">Hi ${escapeHtml(customer.name)},</p>
                <p style="font-size:13px; line-height:1.55; margin:0 0 16px; color:#475569;">
                  We have received your payment details. Our verification team is checking your transaction and your license keys will be dispatched to this email address shortly.
                </p>

                <!-- Order Summary Card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:14px;">
                  <tr>
                    <td style="padding:14px 14px;">
                      <div style="font-size:11px; font-weight:750; text-transform:uppercase; letter-spacing:0.04em; color:#64748b; margin-bottom:10px;">Order Summary</div>
                      
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;" width="38%">Order Ref:</td>
                          <td style="font-size:13px; font-family:monospace; font-weight:750; color:#0f172a; padding:3px 0; text-align:right;">#${escapeHtml(order.orderNumber)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Payment Method:</td>
                          <td style="font-size:13px; font-weight:600; color:#0f172a; padding:3px 0; text-align:right;">${escapeHtml(paymentLabel)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Delivery Email:</td>
                          <td style="font-size:13px; font-weight:600; color:#0f172a; padding:3px 0; text-align:right; word-break:break-all;">${escapeHtml(customer.email)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:3px 0;">Phone:</td>
                          <td style="font-size:13px; font-family:monospace; font-weight:600; color:#0f172a; padding:3px 0; text-align:right;">${escapeHtml(customer.phone)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px; color:#64748b; padding:5px 0 0;">Status:</td>
                          <td style="padding:5px 0 0; text-align:right;">
                            <span style="display:inline-block; padding:2px 8px; border-radius:99px; background:#fef3c7; border:1px solid rgba(245,158,11,0.4); color:#92400e; font-size:11px; font-weight:750;">Pending Verification</span>
                          </td>
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

                <!-- Totals Section (100% fluid, no fixed width) -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:12px; border-collapse:collapse;">
                  <tr>
                    <td style="padding:5px 0; font-size:13px; color:#64748b;">Subtotal:</td>
                    <td style="padding:5px 0; text-align:right; font-size:13px; font-weight:600; color:#0f172a; white-space:nowrap;">${formatCurrency(totals.subtotal)}</td>
                  </tr>
                  ${
                    totals.discount > 0
                      ? `<tr>
                    <td style="padding:5px 0; font-size:13px; color:#10b981;">Discount:</td>
                    <td style="padding:5px 0; text-align:right; font-size:13px; font-weight:600; color:#10b981; white-space:nowrap;">-${formatCurrency(totals.discount)}</td>
                  </tr>`
                      : ""
                  }
                  <tr>
                    <td style="padding:10px 0 4px; font-size:15px; font-weight:800; color:#0f172a; border-top:1px solid #e2e8f0;">Total Payable:</td>
                    <td style="padding:10px 0 4px; text-align:right; font-size:17px; font-weight:850; color:#0d80e8; border-top:1px solid #e2e8f0; white-space:nowrap;">${formatCurrency(totals.total)}</td>
                  </tr>
                </table>

                <!-- Bottom Footer Note -->
                <div style="margin-top:24px; padding-top:16px; border-top:1px solid #f1f5f9; text-align:center;">
                  <p style="font-size:12px; color:#94a3b8; margin:0; line-height:1.5;">
                    If you have questions about your order, reply directly to this email with your Order Reference.
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

export async function sendOrderConfirmationEmail(input: SendOrderConfirmationEmailInput) {
  const config = getMailConfig();

  if (!config) {
    console.warn("Order confirmation email skipped: SMTP configuration is incomplete.");
    return;
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

  const imageAssets = buildProductImageAssets(input.items, input.siteUrl);

  await transporter.sendMail({
    from: config.from,
    to: input.customer.email,
    subject: `Order confirmation - ${input.order.orderNumber}`,
    text: buildOrderConfirmationText(input),
    html: buildOrderConfirmationHtml(input, imageAssets.sources),
    attachments: imageAssets.attachments,
  });
}
