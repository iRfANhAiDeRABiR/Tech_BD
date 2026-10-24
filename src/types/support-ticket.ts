export type TicketCategory =
  | "License Key Activation"
  | "Software Download"
  | "Payment & Verification"
  | "Bug"
  | "General Inquiry"
  | "Feedback";

export type TicketPriority = "Low" | "Normal" | "High" | "Urgent";

export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface SupportTicketMessage {
  id: string;
  sender: "customer" | "support";
  senderName: string;
  message: string;
  createdAt: string; // ISO string
}

export interface SupportTicket {
  id: string;
  ticketCode: string; // e.g. "59C66C"
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceInfo?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  messages: SupportTicketMessage[];
}

export interface CreateTicketInput {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  description: string;
  deviceInfo?: string;
}
