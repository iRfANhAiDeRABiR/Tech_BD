import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export interface InvoiceOrderItem {
  productName: string;
  productOptionName?: string | null;
  productOptionType?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoicePaymentInfo {
  method?: string | null;
  transactionId?: string | null;
  senderNumber?: string | null;
  amount?: number | null;
  status?: string | null;
  verifiedAt?: Date | string | null;
}

export interface InvoiceOrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  customerWhatsApp?: string | null;
  notes?: string | null;
  couponCode?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  currency?: string | null;
  status: string;
  createdAt: Date | string;
  items: InvoiceOrderItem[];
  payment?: InvoicePaymentInfo | null;
}

export function safePdfText(input: string | null | undefined, fallback = ""): string {
  if (!input) return fallback;
  const cleaned = String(input)
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}

export function formatBdt(amount: number | null | undefined): string {
  const val = typeof amount === "number" ? amount : 0;
  return `BDT ${val.toLocaleString("en-US")}`;
}

export function formatPaymentMethod(method?: string | null): string {
  if (!method) return "Mobile Banking";
  const m = method.toUpperCase();
  if (m === "BKASH") return "bKash";
  if (m === "NAGAD") return "Nagad";
  if (m === "ROCKET") return "Rocket";
  if (m === "UPAY") return "Upay";
  if (m === "BANK_TRANSFER") return "Bank Transfer";
  return method;
}

export function formatInvoiceDate(d?: Date | string | null): string {
  if (!d) return "N/A";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "N/A";
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Generates an executive, modern PDF invoice buffer for a confirmed order.
 */
export async function generateInvoicePdf(
  order: InvoiceOrderData,
  siteUrl?: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Standard A4 dimensions in points
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Design Palette
  const darkNavy = rgb(15 / 255, 23 / 255, 42 / 255);        // #0f172a
  const brandIndigo = rgb(79 / 255, 70 / 255, 229 / 255);     // #4f46e5
  const emerald = rgb(5 / 255, 150 / 255, 105 / 255);         // #059669
  const emeraldLight = rgb(236 / 255, 253 / 255, 245 / 255); // #ecfdf5
  const mutedText = rgb(100 / 255, 116 / 255, 139 / 255);    // #64748b
  const slateText = rgb(51 / 255, 65 / 255, 85 / 255);       // #334155
  const borderGrey = rgb(226 / 255, 232 / 255, 240 / 255);   // #e2e8f0
  const lightBg = rgb(248 / 255, 250 / 255, 252 / 255);      // #f8fafc
  const white = rgb(1, 1, 1);

  // 1. Top Decorative Brand Strip
  page.drawRectangle({
    x: 0,
    y: pageHeight - 7,
    width: pageWidth,
    height: 7,
    color: brandIndigo,
  });

  // Try embedding logo
  let logoDrawn = false;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg = await pdfDoc.embedPng(logoBytes);
      const dims = logoImg.scale(0.20);
      page.drawImage(logoImg, {
        x: 40,
        y: pageHeight - 64,
        width: Math.min(dims.width, 135),
        height: Math.min(dims.height, 42),
      });
      logoDrawn = true;
    }
  } catch {
    logoDrawn = false;
  }

  if (!logoDrawn) {
    page.drawText("TECH SOLUTIONS BD", {
      x: 40,
      y: pageHeight - 44,
      size: 17,
      font: fontBold,
      color: darkNavy,
    });
  }

  // Company Details (Left)
  page.drawText("Premier Genuine Software & Digital Licensing Partner", {
    x: 40,
    y: pageHeight - 76,
    size: 8.5,
    font: fontRegular,
    color: mutedText,
  });
  page.drawText("Web: www.techsolutions.bd   |   Hotline: +880 9697-399879   |   Email: support@techsolutions.bd", {
    x: 40,
    y: pageHeight - 88,
    size: 7.5,
    font: fontRegular,
    color: mutedText,
  });

  // Invoice Title & Status (Right)
  const invTitle = "TAX & SALES INVOICE";
  const invWidth = fontBold.widthOfTextAtSize(invTitle, 16);
  page.drawText(invTitle, {
    x: pageWidth - 40 - invWidth,
    y: pageHeight - 42,
    size: 16,
    font: fontBold,
    color: darkNavy,
  });

  const invoiceNo = `INV-${order.orderNumber}`;
  const invNoWidth = fontBold.widthOfTextAtSize(invoiceNo, 10);
  page.drawText(invoiceNo, {
    x: pageWidth - 40 - invNoWidth,
    y: pageHeight - 57,
    size: 10,
    font: fontBold,
    color: brandIndigo,
  });

  const dateLabel = `Date: ${formatInvoiceDate(order.createdAt)}`;
  const dateWidth = fontRegular.widthOfTextAtSize(dateLabel, 8.5);
  page.drawText(dateLabel, {
    x: pageWidth - 40 - dateWidth,
    y: pageHeight - 71,
    size: 8.5,
    font: fontRegular,
    color: mutedText,
  });

  // Paid & Verified Badge (Right)
  const badgeText = "PAID & VERIFIED";
  const badgeWidth = fontBold.widthOfTextAtSize(badgeText, 8.5);
  const pillW = badgeWidth + 20;
  const pillH = 18;
  const pillX = pageWidth - 40 - pillW;
  const pillY = pageHeight - 96;

  page.drawRectangle({
    x: pillX,
    y: pillY,
    width: pillW,
    height: pillH,
    color: emeraldLight,
    borderColor: emerald,
    borderWidth: 1,
  });
  page.drawText(badgeText, {
    x: pillX + 10,
    y: pillY + 5,
    size: 8.5,
    font: fontBold,
    color: emerald,
  });

  // Top Divider line
  page.drawLine({
    start: { x: 40, y: pageHeight - 106 },
    end: { x: pageWidth - 40, y: pageHeight - 106 },
    thickness: 1,
    color: borderGrey,
  });

  // 2. Info Cards (Billed To & Payment Details)
  const cardY = pageHeight - 208;
  const cardW = 248;
  const cardH = 92;

  // Left Card: Billed To
  page.drawRectangle({
    x: 40,
    y: cardY,
    width: cardW,
    height: cardH,
    color: lightBg,
    borderColor: borderGrey,
    borderWidth: 1,
  });
  page.drawText("BILLED / ISSUED TO", {
    x: 52,
    y: cardY + cardH - 18,
    size: 8,
    font: fontBold,
    color: brandIndigo,
  });
  
  const customerName = safePdfText(order.customerName, "Valued Customer");
  page.drawText(customerName.substring(0, 36), {
    x: 52,
    y: cardY + cardH - 33,
    size: 10,
    font: fontBold,
    color: darkNavy,
  });
  page.drawText(`Email: ${safePdfText(order.customerEmail, "Delivered to WhatsApp/Phone")}`, {
    x: 52,
    y: cardY + cardH - 48,
    size: 8.5,
    font: fontRegular,
    color: slateText,
  });
  page.drawText(`Phone: ${safePdfText(order.customerPhone, "N/A")}`, {
    x: 52,
    y: cardY + cardH - 62,
    size: 8.5,
    font: fontRegular,
    color: slateText,
  });
  const waDisplay = order.customerWhatsApp ? safePdfText(order.customerWhatsApp) : safePdfText(order.customerPhone);
  page.drawText(`WhatsApp: ${waDisplay} (Delivery Channel)`, {
    x: 52,
    y: cardY + cardH - 76,
    size: 8,
    font: fontRegular,
    color: mutedText,
  });

  // Right Card: Payment & Verification
  const rightCardX = pageWidth - 40 - cardW;
  page.drawRectangle({
    x: rightCardX,
    y: cardY,
    width: cardW,
    height: cardH,
    color: lightBg,
    borderColor: borderGrey,
    borderWidth: 1,
  });
  page.drawText("PAYMENT & TRANSACTION DETAILS", {
    x: rightCardX + 12,
    y: cardY + cardH - 18,
    size: 8,
    font: fontBold,
    color: brandIndigo,
  });
  page.drawText(`Method: ${formatPaymentMethod(order.payment?.method)}`, {
    x: rightCardX + 12,
    y: cardY + cardH - 33,
    size: 9,
    font: fontBold,
    color: darkNavy,
  });
  page.drawText(`TrxID: ${safePdfText(order.payment?.transactionId, "Confirmed via Hotline")}`, {
    x: rightCardX + 12,
    y: cardY + cardH - 48,
    size: 9,
    font: fontBold,
    color: emerald,
  });
  page.drawText(`Sender Number: ${safePdfText(order.payment?.senderNumber, "N/A")}`, {
    x: rightCardX + 12,
    y: cardY + cardH - 62,
    size: 8.5,
    font: fontRegular,
    color: slateText,
  });
  const verifiedStr = order.payment?.verifiedAt
    ? `Verified: ${formatInvoiceDate(order.payment.verifiedAt)}`
    : "Status: Verified & Confirmed in System";
  page.drawText(verifiedStr, {
    x: rightCardX + 12,
    y: cardY + cardH - 76,
    size: 8,
    font: fontRegular,
    color: mutedText,
  });

  // 3. Itemized Products Table
  let tableY = cardY - 24;
  const tableW = pageWidth - 80; // 515.28

  // Table Header
  page.drawRectangle({
    x: 40,
    y: tableY - 22,
    width: tableW,
    height: 22,
    color: darkNavy,
  });

  page.drawText("#", { x: 48, y: tableY - 15, size: 8, font: fontBold, color: white });
  page.drawText("ITEM / SOFTWARE DESCRIPTION", { x: 72, y: tableY - 15, size: 8, font: fontBold, color: white });
  page.drawText("EDITION / LICENSE TYPE", { x: 295, y: tableY - 15, size: 8, font: fontBold, color: white });
  page.drawText("QTY", { x: 410, y: tableY - 15, size: 8, font: fontBold, color: white });
  page.drawText("UNIT PRICE", { x: 450, y: tableY - 15, size: 8, font: fontBold, color: white });
  page.drawText("TOTAL", { x: 518, y: tableY - 15, size: 8, font: fontBold, color: white });

  tableY -= 22;

  const items = order.items.length > 0 ? order.items : [
    {
      productName: "Genuine Software License",
      productOptionName: "Lifetime Activation",
      quantity: 1,
      unitPrice: order.total,
      lineTotal: order.total,
    }
  ];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowH = 26;
    const rowY = tableY - rowH;

    // Alternating zebra row fill
    if (i % 2 === 1) {
      page.drawRectangle({
        x: 40,
        y: rowY,
        width: tableW,
        height: rowH,
        color: lightBg,
      });
    }

    // Row bottom line
    page.drawLine({
      start: { x: 40, y: rowY },
      end: { x: pageWidth - 40, y: rowY },
      thickness: 0.5,
      color: borderGrey,
    });

    // # index
    page.drawText(String(i + 1), { x: 48, y: rowY + 9, size: 8.5, font: fontRegular, color: mutedText });
    
    // Product Name (truncated safely)
    const pName = safePdfText(item.productName, "Software Product");
    page.drawText(pName.substring(0, 42), { x: 72, y: rowY + 9, size: 8.5, font: fontBold, color: darkNavy });
    
    // Option Name / Edition
    const pOpt = safePdfText(item.productOptionName, item.productOptionType || "Standard License");
    page.drawText(pOpt.substring(0, 24), { x: 295, y: rowY + 9, size: 8, font: fontRegular, color: mutedText });
    
    // Quantity
    page.drawText(String(item.quantity), { x: 416, y: rowY + 9, size: 8.5, font: fontRegular, color: darkNavy });
    
    // Unit Price
    const unitStr = formatBdt(item.unitPrice);
    const unitW = fontRegular.widthOfTextAtSize(unitStr, 8.5);
    page.drawText(unitStr, { x: 495 - unitW, y: rowY + 9, size: 8.5, font: fontRegular, color: darkNavy });

    // Line Total
    const totalStr = formatBdt(item.lineTotal);
    const totW = fontBold.widthOfTextAtSize(totalStr, 8.5);
    page.drawText(totalStr, { x: pageWidth - 45 - totW, y: rowY + 9, size: 8.5, font: fontBold, color: darkNavy });

    tableY -= rowH;
  }

  // 4. Totals Summary & QR Code Section
  const summaryY = tableY - 18;

  // QR Code on Left (Official verification portal)
  const cleanSiteUrl = (
    siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.techsolutions.bd"
  ).replace(/\/+$/, "");

  const qrUrl = `${cleanSiteUrl}/order/verify?ref=${encodeURIComponent(order.orderNumber)}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 256 });
  const qrImage = await pdfDoc.embedPng(qrDataUrl);
  const qrSize = 64;
  page.drawImage(qrImage, {
    x: 45,
    y: summaryY - qrSize - 4,
    width: qrSize,
    height: qrSize,
  });

  page.drawText("OFFICIAL VERIFICATION QR", {
    x: 118,
    y: summaryY - 12,
    size: 7.5,
    font: fontBold,
    color: brandIndigo,
  });
  page.drawText("Scan with your smartphone camera to verify this invoice", {
    x: 118,
    y: summaryY - 24,
    size: 7,
    font: fontRegular,
    color: mutedText,
  });
  page.drawText("authenticity and view digital license dispatch status online.", {
    x: 118,
    y: summaryY - 34,
    size: 7,
    font: fontRegular,
    color: mutedText,
  });
  page.drawText("100% Genuine & Legitimate Digital Licenses Guaranteed.", {
    x: 118,
    y: summaryY - 48,
    size: 7,
    font: fontBold,
    color: emerald,
  });

  // Totals Box on Right
  const totBoxW = 215;
  const totBoxX = pageWidth - 40 - totBoxW;
  let curTotY = summaryY - 8;

  // Subtotal
  page.drawText("Subtotal:", { x: totBoxX, y: curTotY, size: 8.5, font: fontRegular, color: mutedText });
  const subStr = formatBdt(order.subtotal);
  const subW = fontRegular.widthOfTextAtSize(subStr, 8.5);
  page.drawText(subStr, { x: pageWidth - 40 - subW, y: curTotY, size: 8.5, font: fontRegular, color: darkNavy });

  curTotY -= 18;
  
  // Discount (if coupon applied)
  if (order.discount > 0) {
    const discLabel = order.couponCode ? `Discount (${order.couponCode}):` : "Discount / Promo:";
    page.drawText(discLabel, { x: totBoxX, y: curTotY, size: 8.5, font: fontRegular, color: emerald });
    const discStr = `- ${formatBdt(order.discount)}`;
    const discW = fontRegular.widthOfTextAtSize(discStr, 8.5);
    page.drawText(discStr, { x: pageWidth - 40 - discW, y: curTotY, size: 8.5, font: fontRegular, color: emerald });
    curTotY -= 18;
  }

  // Clear vertical buffer gap between subtotal/discount and the Total Paid box
  curTotY -= 8;

  // Grand Total Banner Box (Height: 28pt)
  const boxHeight = 28;
  const boxBottom = curTotY - boxHeight;

  page.drawRectangle({
    x: totBoxX - 8,
    y: boxBottom,
    width: totBoxW + 8,
    height: boxHeight,
    color: rgb(241 / 255, 245 / 255, 249 / 255),
    borderColor: borderGrey,
    borderWidth: 1,
  });

  page.drawText("TOTAL PAID:", {
    x: totBoxX,
    y: boxBottom + 9.5,
    size: 9.5,
    font: fontBold,
    color: darkNavy,
  });

  const grandStr = formatBdt(order.total);
  const grandW = fontBold.widthOfTextAtSize(grandStr, 11);
  page.drawText(grandStr, {
    x: pageWidth - 40 - grandW,
    y: boxBottom + 9,
    size: 11,
    font: fontBold,
    color: brandIndigo,
  });

  // Balance Due note cleanly separated underneath the box
  const balanceY = boxBottom - 16;
  page.drawText("Balance Due: BDT 0.00 (PAID IN FULL)", {
    x: totBoxX,
    y: balanceY,
    size: 7.5,
    font: fontBold,
    color: emerald,
  });

  // 5. Digital Delivery Notice & Terms Card (Bottom)
  const termsY = 90;
  const termsH = 65;
  page.drawRectangle({
    x: 40,
    y: termsY,
    width: tableW,
    height: termsH,
    color: lightBg,
    borderColor: borderGrey,
    borderWidth: 1,
  });

  page.drawText("IMPORTANT DIGITAL DELIVERY & SUPPORT INSTRUCTIONS:", {
    x: 52,
    y: termsY + termsH - 16,
    size: 7.5,
    font: fontBold,
    color: brandIndigo,
  });
  page.drawText("1. Digital Licenses & Setup Guides: Delivered to your registered email address automatically upon payment confirmation.", {
    x: 52,
    y: termsY + termsH - 28,
    size: 7,
    font: fontRegular,
    color: darkNavy,
  });
  page.drawText("2. Authenticity Guarantee: All software products provided by Tech Solutions BD are 100% genuine with official activation support.", {
    x: 52,
    y: termsY + termsH - 40,
    size: 7,
    font: fontRegular,
    color: darkNavy,
  });
  page.drawText("3. Need Assistance? For instant installation help or key support, WhatsApp: +880 9697-399879 or Email: support@techsolutions.bd", {
    x: 52,
    y: termsY + termsH - 52,
    size: 7,
    font: fontRegular,
    color: darkNavy,
  });

  // 6. Footer
  page.drawLine({
    start: { x: 40, y: 70 },
    end: { x: pageWidth - 40, y: 70 },
    thickness: 0.5,
    color: borderGrey,
  });

  const footerText = "Tech Solutions BD (www.techsolutions.bd) - Computer Generated Official Sales & Tax Invoice. No signature required.";
  const footW = fontRegular.widthOfTextAtSize(footerText, 7.5);
  page.drawText(footerText, {
    x: (pageWidth - footW) / 2,
    y: 52,
    size: 7.5,
    font: fontRegular,
    color: mutedText,
  });

  const copyrightText = `Generated on ${new Date().toUTCString()} - Order Reference ID verified. Thank you for choosing Tech Solutions BD!`;
  const copyW = fontOblique.widthOfTextAtSize(copyrightText, 6.8);
  page.drawText(copyrightText, {
    x: (pageWidth - copyW) / 2,
    y: 40,
    size: 6.8,
    font: fontOblique,
    color: mutedText,
  });

  return await pdfDoc.save();
}

