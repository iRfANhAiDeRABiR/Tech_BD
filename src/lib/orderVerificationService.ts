import prisma from "@/lib/prisma";
import { sendOrderStatusEmail, type OrderStatusAction } from "@/lib/orderStatusEmail";

export interface ProcessTelegramOrderActionResult {
  success: boolean;
  orderNumber: string;
  action: OrderStatusAction;
  order?: any;
  alreadyProcessed?: boolean;
  emailSent?: boolean;
  error?: string;
}

export async function processTelegramOrderAction({
  orderNumber,
  action,
}: {
  orderNumber: string;
  action: OrderStatusAction;
}): Promise<ProcessTelegramOrderActionResult> {
  try {
    const cleanRef = orderNumber.trim();

    // 1. Fetch current order with payment details
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: cleanRef },
      include: {
        payment: true,
      },
    });

    if (!existingOrder) {
      console.warn(`[processTelegramOrderAction] Order #${cleanRef} not found.`);
      return { success: false, orderNumber: cleanRef, action, error: "Order not found" };
    }

    const wasAlreadyConfirmed =
      existingOrder.status === "COMPLETED" &&
      existingOrder.payment?.status === "VERIFIED";

    const wasAlreadyInvalid =
      existingOrder.payment?.status === "REJECTED";

    let updatedOrder;
    let shouldSendEmail = false;

    if (action === "CONFIRMED") {
      updatedOrder = await prisma.order.update({
        where: { orderNumber: cleanRef },
        data: {
          status: "COMPLETED",
          payment: {
            update: {
              status: "VERIFIED",
              verifiedAt: new Date(),
            },
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { image: true },
              },
            },
          },
          payment: true,
        },
      });

      shouldSendEmail = !wasAlreadyConfirmed;
    } else {
      updatedOrder = await prisma.order.update({
        where: { orderNumber: cleanRef },
        data: {
          payment: {
            update: {
              status: "REJECTED",
            },
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { image: true },
              },
            },
          },
          payment: true,
        },
      });

      shouldSendEmail = !wasAlreadyInvalid;
    }

    // 2. Dispatch status update email to customer asynchronously
    let emailSent = false;
    if (shouldSendEmail && updatedOrder.customerEmail) {
      sendOrderStatusEmail({
        order: updatedOrder,
        action,
      })
        .then((res) => {
          if (res.success) {
            console.log(`[processTelegramOrderAction] Status email (${action}) sent to ${updatedOrder.customerEmail} for #${cleanRef}`);
          } else {
            console.warn(`[processTelegramOrderAction] Status email (${action}) failed for #${cleanRef}: ${res.error}`);
          }
        })
        .catch((err) => {
          console.error(`[processTelegramOrderAction] Unexpected error sending status email for #${cleanRef}:`, err);
        });
      emailSent = true;
    }

    return {
      success: true,
      orderNumber: cleanRef,
      action,
      order: updatedOrder,
      alreadyProcessed: action === "CONFIRMED" ? wasAlreadyConfirmed : wasAlreadyInvalid,
      emailSent,
    };
  } catch (err: any) {
    console.error(`[processTelegramOrderAction] Error processing order #${orderNumber}:`, err);
    return {
      success: false,
      orderNumber,
      action,
      error: err.message,
    };
  }
}

