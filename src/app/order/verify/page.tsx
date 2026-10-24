import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { OrderVerifyClient } from "./OrderVerifyClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Official Invoice & Order Verification | Tech Solutions BD",
  description:
    "Verify genuine software licenses, official tax invoices, and payment confirmation records authenticated by Tech Solutions BD.",
};

export default async function OrderVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; id?: string; order?: string }>;
}) {
  const params = await searchParams;
  const rawRef = params.ref || params.id || params.order || "";
  const cleanRef = rawRef.trim().replace(/^#+/, "").replace(/^INV-/, "");

  let orderData = null;

  if (cleanRef) {
    try {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: { equals: cleanRef, mode: "insensitive" } },
            { id: { equals: cleanRef, mode: "insensitive" } },
          ],
        },
        include: {
          items: true,
          payment: true,
        },
      });

      if (order) {
        orderData = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          customerWhatsApp: order.customerWhatsApp,
          subtotal: order.subtotal,
          discount: order.discount,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          payment: order.payment
            ? {
                method: order.payment.method,
                transactionId: order.payment.transactionId,
                senderNumber: order.payment.senderNumber,
                status: order.payment.status,
                verifiedAt: order.payment.verifiedAt?.toISOString() || null,
              }
            : null,
          items: order.items.map((item) => ({
            id: item.id,
            productName: item.productName,
            productOptionName: item.productOptionName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        };
      }
    } catch (err) {
      console.error("Order verification page lookup error:", err);
    }
  }

  return <OrderVerifyClient initialRef={cleanRef} order={orderData} />;
}

