import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { generateInvoicePdf } from "@/lib/invoiceGenerator";
import { extractClientIp } from "@/lib/ip-utils";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientIp = extractClientIp(request.headers);
    if (!rateLimit(`invoice-gen:${clientIp}`, 20, 60_000)) {
      return NextResponse.json(
        { error: "Too many invoice download requests. Please wait a minute." },
        { status: 429 }
      );
    }

    const { id: rawId } = await params;
    if (!rawId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const cleanId = decodeURIComponent(rawId).trim().replace(/^#+/, "");

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { orderNumber: { equals: cleanId, mode: "insensitive" } },
        ],
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or if the order is confirmed
    const session = await auth();
    const isAdmin = !!session?.user;

    const isConfirmed =
      order.status === "COMPLETED" ||
      order.status === "PAID" ||
      order.payment?.status === "VERIFIED";

    if (!isConfirmed && !isAdmin) {
      return NextResponse.json(
        {
          error: "Invoice is only available for confirmed and verified orders.",
          orderStatus: order.status,
          paymentStatus: order.payment?.status || "NOT_SUBMITTED",
        },
        { status: 403 }
      );
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const siteUrl = host ? `${proto}://${host}` : undefined;

    const pdfBytes = await generateInvoicePdf(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerWhatsApp: order.customerWhatsApp,
        notes: order.notes,
        couponCode: order.couponCode,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          productName: item.productName,
          productOptionName: item.productOptionName,
          productOptionType: item.productOptionType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        payment: order.payment
          ? {
              method: order.payment.method,
              transactionId: order.payment.transactionId,
              senderNumber: order.payment.senderNumber,
              amount: order.payment.amount,
              status: order.payment.status,
              verifiedAt: order.payment.verifiedAt,
            }
          : null,
      },
      siteUrl
    );

    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get("download") === "true";
    const dispositionType = forceDownload ? "attachment" : "inline";

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${dispositionType}; filename="Invoice-${order.orderNumber}.pdf"`,
        "Cache-Control": "private, max-age=3600, no-transform",
      },
    });
  } catch (error) {
    console.error("Failed to generate order invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}
