import nodemailer from "nodemailer";
import { existsSync } from "node:fs";
import path from "node:path";

type ConfirmationOrder = {
  orderNumber: string;
  total: number;
};

type ConfirmationCustomer = {
  name: string;
  email: string;
  phone: string;
};

type ConfirmationItem = {
  productName: string;
  productImage?: string;
  optionName?: string;
  quantity: number;
  unitPrice: number;
};

type ConfirmationTotals = {
  subtotal: number;
  discount: number;
  total: number;
};

type SendOrderConfirmationEmailInput = {
  order: ConfirmationOrder;
  customer: ConfirmationCustomer;
  items: ConfirmationItem[];
  totals: ConfirmationTotals;
  paymentLabel: string;
  siteUrl?: string;
};

type ProductImageAsset = {
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

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resolveImageUrl(imageUrl: string | undefined, siteUrl: string | undefined) {
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

function getPublicImagePath(imageUrl: string | undefined) {
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

function buildProductImageAssets(
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

function getMailConfig() {
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

function shouldAllowSelfSignedSmtpCertificate() {
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

Thank you for your order from Tech Solutions BD.

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

If you need faster support, please contact us on WhatsApp with your Order ID.

Best regards,
Tech Solutions BD Team`;
}

function buildOrderConfirmationHtml({
  order,
  customer,
  items,
  totals,
  paymentLabel,
  siteUrl,
}: SendOrderConfirmationEmailInput, imageSources = new Map<number, string>()) {
  const rows = items
    .map((item, index) => {
      const itemName = `${escapeHtml(item.productName)}${
        item.optionName ? ` <span style="color:#64748b;">(${escapeHtml(item.optionName)})</span>` : ""
      }`;
      const imageUrl = imageSources.get(index) ?? resolveImageUrl(item.productImage, siteUrl);
      const imageMarkup = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.productName)}" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;background:#ffffff;" />`
        : `<div style="width:64px;height:64px;border-radius:8px;border:1px solid #e5e7eb;background:#f8fafc;color:#94a3b8;font-size:11px;line-height:64px;text-align:center;">No image</div>`;

      return `<tr>
        <td style="padding:12px;border:1px solid #e5e7eb;vertical-align:middle;width:88px;">${imageMarkup}</td>
        <td style="padding:12px;border:1px solid #e5e7eb;vertical-align:middle;font-size:14px;font-weight:600;color:#111827;">${itemName}</td>
        <td style="padding:12px;border:1px solid #e5e7eb;text-align:center;vertical-align:middle;color:#111827;">${item.quantity}</td>
        <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;vertical-align:middle;font-weight:700;color:#111827;">${formatCurrency(
          item.unitPrice * item.quantity,
        )}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
  <html>
    <body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px;color:#ffffff;">
            <h1 style="margin:0;font-size:24px;">Order confirmation</h1>
            <p style="margin:8px 0 0;opacity:.92;">Thank you for shopping with Tech Solutions BD.</p>
          </div>

          <div style="padding:28px;">
            <p style="font-size:16px;margin:0 0 18px;">Hi ${escapeHtml(customer.name)},</p>
            <p style="line-height:1.6;margin:0 0 22px;">We have received your order and payment details. Our team will verify your payment and send your license key/product details to this email shortly.</p>

            <div style="background:#f1f5f9;border-radius:14px;padding:18px;margin-bottom:18px;border:1px solid #e2e8f0;">
              <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Customer Details</h2>
              <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(customer.name)}</p>
              <p style="margin:0 0 8px;"><strong>Phone/WhatsApp:</strong> ${escapeHtml(customer.phone)}</p>
              <p style="margin:0;"><strong>Email:</strong> ${escapeHtml(customer.email)}</p>
            </div>

            <div style="background:#f8fafc;border-radius:14px;padding:18px;margin-bottom:22px;border:1px solid #e2e8f0;">
              <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Order Details</h2>
              <p style="margin:0 0 8px;"><strong>Order ID:</strong> ${escapeHtml(order.orderNumber)}</p>
              <p style="margin:0 0 8px;"><strong>Payment method:</strong> ${escapeHtml(paymentLabel)}</p>
              <p style="margin:0;"><strong>Payment status:</strong> Submitted for verification</p>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:18px;border:1px solid #e5e7eb;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="padding:12px;border:1px solid #e5e7eb;text-align:left;font-size:13px;color:#374151;">Product image</th>
                  <th style="padding:12px;border:1px solid #e5e7eb;text-align:left;font-size:13px;color:#374151;">Product Name</th>
                  <th style="padding:12px;border:1px solid #e5e7eb;text-align:center;font-size:13px;color:#374151;">Quantity</th>
                  <th style="padding:12px;border:1px solid #e5e7eb;text-align:right;font-size:13px;color:#374151;">Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <table style="width:280px;margin-left:auto;border-collapse:collapse;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:700;">Sub-Total</td>
                <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;font-weight:700;">${formatCurrency(totals.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:700;">Discount</td>
                <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;font-weight:700;">${formatCurrency(totals.discount)}</td>
              </tr>
              <tr>
                <td style="padding:12px;border:1px solid #e5e7eb;background:#f3f4f6;font-size:16px;font-weight:800;">Total</td>
                <td style="padding:12px;border:1px solid #e5e7eb;text-align:right;font-size:16px;font-weight:800;">${formatCurrency(totals.total)}</td>
              </tr>
            </table>

            <p style="line-height:1.6;margin:24px 0 0;color:#475569;">For faster support, contact us on WhatsApp and mention your Order ID.</p>
            <p style="line-height:1.6;margin:18px 0 0;color:#0f172a;">Best regards,<br><strong>Tech Solutions BD Team</strong></p>
          </div>
        </div>
      </div>
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