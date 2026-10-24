import { NextRequest, NextResponse } from "next/server";
import { sendTelegramTicketNotification } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ticketCode,
      category,
      priority,
      subject,
      description,
      customerName,
      customerEmail,
      orderNumber,
      deviceInfo,
    } = body;

    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: "Subject, category, and description are required" },
        { status: 400 }
      );
    }

    // Attempt to notify store admins on Telegram
    await sendTelegramTicketNotification({
      ticketCode: ticketCode || "NEW",
      category,
      priority: priority || "Normal",
      subject,
      description,
      userName: customerName,
      userEmail: customerEmail,
      orderNumber,
      deviceInfo,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Ticket submitted successfully",
      ticketCode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

