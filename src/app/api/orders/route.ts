import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { PaymentMethod } from "@/generated/prisma/enums";
import { sendOrderConfirmationEmail } from "@/lib/orderConfirmationEmail";
import { sendTelegramOrderNotification } from "@/lib/telegram";
import { rateLimit } from "@/lib/rateLimit";
import { logAdminEvent } from "@/lib/audit-logs-store";
import { validateCoupon, incrementCouponUsage } from "@/lib/coupons-store";

export const runtime = "nodejs";

import { extractClientIp } from "@/lib/ip-utils";

const checkoutOrderItemSchema = z.object({
  productId: z.string().trim().min(1).max(120),
  optionId: z.string().trim().min(1).max(120).optional(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(6).max(25),
    email: z.string().trim().email().max(200),
  }),
  payment: z.object({
    method: z.enum(["bkash", "nagad", "rocket", "upay"]),
    label: z.string().trim().min(1).max(60),
    paymentNumber: z.string().trim().min(1).max(30),
    senderNumber: z.string().trim().min(1).max(30),
    transactionId: z.string().trim().min(4).max(120),
  }),
  notes: z.string().trim().max(1000).optional().nullable(),
  couponCode: z.string().trim().max(50).optional().nullable(),
  clientIp: z.string().trim().max(100).optional().nullable(),
  items: z.array(checkoutOrderItemSchema).min(1).max(50),
});

const paymentMethodMap = {
  bkash: PaymentMethod.BKASH,
  nagad: PaymentMethod.NAGAD,
  rocket: PaymentMethod.ROCKET,
  upay: PaymentMethod.UPAY,
} as const;

function makeOrderNumber() {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `TSBD-${datePart}-${randomPart}`;
}

async function getUniqueOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = makeOrderNumber();
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });

    if (!existingOrder) {
      return orderNumber;
    }
  }

  return `TSBD-${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = checkoutOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid checkout data.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const ip = extractClientIp(request.headers);

    // Basic abuse protection on this public endpoint.
    if (!rateLimit(`orders:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { message: "Too many requests. Please try again shortly." },
        { status: 429 },
      );
    }

    // SECURITY: Never trust browser-supplied prices or totals.
    // Resolve every item against the database and use trusted pricing only.
    const resolvedItems: Array<{
      productId: string;
      productOptionId: string | null;
      productOptionName: string | null;
      productOptionType: string | null;
      productName: string;
      productImage: string;
      unitPrice: number;
      originalUnitPrice: number | null;
      quantity: number;
      lineTotal: number;
    }> = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
          originalPrice: true,
          status: true,
          outOfStock: true,
          options: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
              originalPrice: true,
            },
          },
        },
      });

      if (
        !product ||
        product.status !== "ACTIVE" ||
        product.outOfStock
      ) {
        return NextResponse.json(
          { message: `Product "${item.productId}" is not available.` },
          { status: 400 },
        );
      }

      let unitPrice = product.price;
      let originalUnitPrice: number | null = product.originalPrice ?? null;
      let optionName: string | null = null;
      let optionType: string | null = null;
      let optionId: string | null = null;

      if (item.optionId) {
        const option = product.options.find((o) => o.id === item.optionId);
        if (!option) {
          return NextResponse.json(
            { message: `Selected option for "${product.name}" is not available.` },
            { status: 400 },
          );
        }
        unitPrice = option.price;
        originalUnitPrice = option.originalPrice ?? null;
        optionName = option.name;
        optionType = option.type;
        optionId = option.id;
      }

      resolvedItems.push({
        productId: product.id,
        productOptionId: optionId,
        productOptionName: optionName,
        productOptionType: optionType,
        productName: product.name,
        productImage: product.image,
        unitPrice,
        originalUnitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      });
    }

    // Authoritative totals computed exclusively from database prices
    const subtotal = resolvedItems.reduce(
      (total, item) => total + item.lineTotal,
      0,
    );

    // Server-side authoritative coupon validation
    let discount = 0;
    let validatedCoupon: string | null = null;
    const cleanCoupon = data.couponCode?.trim().toUpperCase();
    if (cleanCoupon) {
      const couponValidation = await validateCoupon(cleanCoupon, subtotal);
      if (couponValidation.valid) {
        discount = couponValidation.discountAmount;
        validatedCoupon = couponValidation.code;
      }
    }

    const total = Math.max(0, subtotal - discount);

    const orderNumber = await getUniqueOrderNumber();
    const orderNotes = `[IP: ${ip}] ${
      data.notes
        ? `Payment: ${data.payment.label} | Requirements: ${data.notes}`
        : `Payment method: ${data.payment.label}`
    }`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: data.customer.name,
        customerEmail: data.customer.email,
        customerPhone: data.customer.phone,
        customerWhatsApp: data.customer.phone,
        couponCode: validatedCoupon,
        subtotal,
        discount,
        total,
        status: "PAYMENT_SUBMITTED",
        notes: orderNotes,
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.productId,
            productOptionId: item.productOptionId,
            productOptionName: item.productOptionName,
            productOptionType: item.productOptionType,
            productName: item.productName,
            unitPrice: item.unitPrice,
            originalUnitPrice: item.originalUnitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
        },
        payment: {
          create: {
            method: paymentMethodMap[data.payment.method],
            transactionId: data.payment.transactionId,
            senderNumber: data.payment.senderNumber,
            paymentNumber: data.payment.paymentNumber,
            amount: total,
            status: "SUBMITTED",
          },
        },
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
      },
    });

    if (validatedCoupon) {
      void incrementCouponUsage(validatedCoupon);
    }

    // Dispatch background notifications asynchronously without blocking the client response
    void logAdminEvent({
      action: "ORDER_PLACED",
      category: "ORDERS",
      entityType: "Order",
      entityId: order.id,
      entityName: order.orderNumber,
      ipAddress: ip,
      adminEmail: data.customer.email,
      details: {
        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        total,
        orderNumber: order.orderNumber,
        paymentMethod: data.payment.label,
        transactionId: data.payment.transactionId,
        ip,
      },
      severity: "INFO",
    });

    void sendOrderConfirmationEmail({
      order,
      customer: data.customer,
      items: resolvedItems,
      totals: { subtotal, discount, total },
      paymentLabel: data.payment.label,
      siteUrl: request.headers.get("origin") ?? undefined,
    }).catch((emailError) => {
      console.error("Failed to send order confirmation email", emailError);
    });

    void sendTelegramOrderNotification({
      orderNumber: order.orderNumber,
      customerName: data.customer.name,
      customerEmail: data.customer.email,
      customerPhone: data.customer.phone,
      items: resolvedItems.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      total,
      discount,
      couponCode: validatedCoupon,
      paymentMethod: data.payment.label,
      senderNumber: data.payment.senderNumber,
      receiverNumber: data.payment.paymentNumber,
      transactionId: data.payment.transactionId,
      notes: data.notes,
    }).catch((teleErr) => {
      console.error("Failed to send order alert to Telegram", teleErr);
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create checkout order", error);

    // Prevent duplicate payment submission errors
    if (error?.code === "P2002") {
      return NextResponse.json(
        { message: "This Transaction ID has already been submitted for an existing order. Please verify your TrxID or reach out to our WhatsApp support." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Could not save the order. Please try again." },
      { status: 500 },
    );
  }
}
