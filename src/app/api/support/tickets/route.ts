import { NextRequest, NextResponse } from "next/server";
import {
  getAllSupportTicketsServer,
  getSupportTicketByIdServer,
  createSupportTicketServer,
  addReplyToSupportTicketServer,
  updateSupportTicketStatusServer,
} from "@/lib/support-tickets-store";
import {
  sendTelegramTicketNotification,
  sendTelegramTicketReplyNotification,
} from "@/lib/telegram";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const email = searchParams.get("email") || undefined;

    if (id) {
      const ticket = await getSupportTicketByIdServer(id);
      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      return NextResponse.json({ ticket });
    }

    let tickets = await getAllSupportTicketsServer({ status, category, search });
    if (email) {
      tickets = tickets.filter(
        (t) => t.customerEmail.toLowerCase() === email.toLowerCase().trim()
      );
    }

    return NextResponse.json({ tickets });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "create";

    if (action === "reply") {
      const { ticketId, message, sender, senderName, subject } = body;
      if (!ticketId || !message) {
        return NextResponse.json(
          { error: "Ticket ID and message are required" },
          { status: 400 }
        );
      }

      const updated = await addReplyToSupportTicketServer(
        ticketId,
        message,
        sender || "customer",
        senderName || (sender === "support" ? "Tech Solutions BD Support" : "Customer")
      );

      if (!updated) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      // If customer replied, notify admin via Telegram
      if (sender !== "support") {
        sendTelegramTicketReplyNotification({
          ticketCode: updated.ticketCode,
          senderName: senderName || "Customer",
          replyMessage: message,
          subject: subject || updated.subject,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, ticket: updated });
    }

    // Default: Create Ticket
    const {
      ticketCode,
      category,
      priority,
      subject,
      description,
      customerName,
      customerPhone,
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

    const newTicket = await createSupportTicketServer({
      ticketCode,
      category,
      priority: priority || "Normal",
      subject,
      description,
      customerName: customerName || "Customer",
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "guest@techsolutionsbd.com",
      orderNumber,
      deviceInfo,
    });

    // Notify Telegram Admin Bot in real-time
    sendTelegramTicketNotification({
      ticketCode: newTicket.ticketCode,
      category: newTicket.category,
      priority: newTicket.priority,
      subject: newTicket.subject,
      description: description.trim(),
      userName: newTicket.customerName,
      userPhone: newTicket.customerPhone,
      userEmail: newTicket.customerEmail,
      orderNumber: newTicket.orderNumber,
      deviceInfo: newTicket.deviceInfo,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      ticket: newTicket,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, status, priority } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: "ticketId and status are required" },
        { status: 400 }
      );
    }

    const updated = await updateSupportTicketStatusServer(
      ticketId,
      status,
      priority
    );

    if (!updated) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
